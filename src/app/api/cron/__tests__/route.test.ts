import { GET } from '../route';
import { notion } from '@/lib/notion-client';

jest.mock('@/lib/notion-client', () => ({
    notion: {
        pages: {
            create: jest.fn(),
        }
    }
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

describe('Cron API Route GET', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv, CRON_SECRET: 'test_secret' };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('returns 401 when CRON_SECRET is missing or invalid', async () => {
        const req = {
            headers: { get: (name: string) => name === 'authorization' ? 'Bearer invalid' : null }
        };

        const response = await GET(req as any);
        expect(response.status).toBe(401);
        expect(await response.text()).toBe('Unauthorized');
    });

    it('inserts into Notion and returns 200 on success', async () => {
        const req = {
            headers: { get: (name: string) => name === 'authorization' ? 'Bearer test_secret' : null }
        };

        (notion.pages.create as jest.Mock).mockResolvedValueOnce({});

        const response = await GET(req as any);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(notion.pages.create).toHaveBeenCalled();
    });

    it('uses correct Notion property names matching the Metrics DB schema', async () => {
        process.env.NOTION_METRICS_DB_ID = 'metrics-db-id';

        const req = {
            headers: { get: (name: string) => name === 'authorization' ? 'Bearer test_secret' : null }
        };

        (notion.pages.create as jest.Mock).mockResolvedValueOnce({});

        await GET(req as any);

        const call = (notion.pages.create as jest.Mock).mock.calls[0][0];
        expect(call.parent.database_id).toBe('metrics-db-id');

        const propKeys = Object.keys(call.properties);
        expect(propKeys).toContain('name');
        expect(propKeys).toContain('value');
        expect(propKeys).toContain('projects');
        expect(propKeys).not.toContain('date');
        expect(propKeys).not.toContain('project_ID');

        // Verify property types match DB schema
        expect(call.properties.name).toHaveProperty('title');
        expect(call.properties.value).toHaveProperty('number');
        expect(call.properties.projects).toHaveProperty('relation');
    });
});
