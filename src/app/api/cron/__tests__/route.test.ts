import { GET } from '../route';
import { notion } from '@/lib/notion-client';
import { getDataClient } from '@/lib/client-factory';

jest.mock('@/lib/notion-client', () => ({
    notion: {
        pages: {
            create: jest.fn(),
            update: jest.fn(),
        },
        databases: {
            query: jest.fn(),
        }
    }
}));

jest.mock('@/lib/client-factory', () => ({
    getDataClient: jest.fn(),
}));

jest.mock('next/server', () => {
    class MockNextResponse {
        status: number;
        body: string;
        constructor(body: string, init?: any) {
            this.body = body;
            this.status = init?.status || 200;
        }
        static json(body: any, init?: any) {
            return { status: init?.status || 200, json: async () => body };
        }
        async text() { return this.body; }
    }

    return {
        NextResponse: MockNextResponse,
        NextRequest: jest.fn(),
    };
});

const authReq = {
    headers: { get: (name: string) => name === 'authorization' ? 'Bearer test_secret' : null }
};

const noAuthReq = {
    headers: { get: (name: string) => name === 'authorization' ? 'Bearer invalid' : null }
};

describe('Cron API Route GET', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv, CRON_SECRET: 'test_secret', NOTION_METRICS_DB_ID: 'metrics-db-id' };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('returns 401 when CRON_SECRET is missing or invalid', async () => {
        const response = await GET(noAuthReq as any);
        expect(response.status).toBe(401);
        expect(await response.text()).toBe('Unauthorized');
    });

    it('looks up the YouTube project and creates a new metric if it does not exist', async () => {
        const mockClient = {
            getProjects: jest.fn().mockResolvedValue([
                { id: 'yt-123', name: 'My Channel', platform: 'youtube' },
            ]),
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);

        // Mock query returning no results (i.e., metric doesn't exist)
        (notion.databases.query as jest.Mock).mockResolvedValueOnce({ results: [] });
        (notion.pages.create as jest.Mock).mockResolvedValueOnce({});

        const response = await GET(authReq as any);
        expect(response.status).toBe(200);

        expect(notion.databases.query).toHaveBeenCalledWith(expect.objectContaining({
            database_id: 'metrics-db-id',
            filter: expect.objectContaining({
                and: expect.arrayContaining([
                    { property: 'name', title: { equals: 'Subscribers' } },
                    { property: 'projects', relation: { contains: 'yt-123' } }
                ])
            })
        }));

        expect(notion.pages.create).toHaveBeenCalled();
        expect(notion.pages.update).not.toHaveBeenCalled();

        const createCall = (notion.pages.create as jest.Mock).mock.calls[0][0];
        expect(createCall.properties.projects.relation[0].id).toBe('yt-123');
        expect(createCall.parent.database_id).toBe('metrics-db-id');

        const propKeys = Object.keys(createCall.properties);
        expect(propKeys).toContain('name');
        expect(propKeys).toContain('value');
        expect(propKeys).toContain('projects');
    });

    it('updates the metric row if it already exists for the project', async () => {
        const mockClient = {
            getProjects: jest.fn().mockResolvedValue([
                { id: 'yt-123', name: 'My Channel', platform: 'youtube' },
            ]),
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);

        // Mock query returning an existing page
        (notion.databases.query as jest.Mock).mockResolvedValueOnce({
            results: [{ id: 'existing-page-id-456' }]
        });
        (notion.pages.update as jest.Mock).mockResolvedValueOnce({});

        const response = await GET(authReq as any);
        expect(response.status).toBe(200);

        expect(notion.pages.create).not.toHaveBeenCalled();
        expect(notion.pages.update).toHaveBeenCalledWith({
            page_id: 'existing-page-id-456',
            properties: {
                'value': { number: 15000 }
            }
        });
    });

    it('returns 404 when no YouTube project exists', async () => {
        const mockClient = {
            getProjects: jest.fn().mockResolvedValue([
                { id: 'other-1', name: 'SaaS App' },
            ]),
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);

        const response = await GET(authReq as any);
        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(notion.pages.create).not.toHaveBeenCalled();
    });
});
