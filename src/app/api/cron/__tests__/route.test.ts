import { GET } from '../route';
import { notion } from '@/lib/notion-client';
import { getDataClient } from '@/lib/client-factory';
import { getMetricsProvider } from '@/lib/providers';

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

jest.mock('@/lib/providers', () => ({
    getMetricsProvider: jest.fn(),
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

describe('Cron API Route GET (DDD)', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv, CRON_SECRET: 'test_secret', NOTION_METRICS_DB_ID: 'metrics-db-id' };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('processes multiple projects across different platforms, fetching and upserting multiple metrics', async () => {
        // 1. Mock the Notion Client to return two projects: one Youtube, one Invalid
        const mockClient = {
            getProjects: jest.fn().mockResolvedValue([
                { id: 'yt-123', name: 'My Channel', platform: 'youtube', platformAccountId: 'yt-account' },
                { id: 'no-id-456', name: 'No Platform Account ID', platform: 'youtube' }, // Should be skipped
                { id: 'other-1', name: 'SaaS App', platform: 'unknown' }, // Provider factory might throw, we should catch/skip
            ]),
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);

        // 2. Mock the Provider Factory
        const mockYouTubeProvider = {
            getMetrics: jest.fn().mockResolvedValue({
                subscribers: 10000,
                views: 500000
            })
        };
        (getMetricsProvider as jest.Mock).mockImplementation((platform) => {
            if (platform === 'youtube') return mockYouTubeProvider;
            throw new Error('Not implemented');
        });

        // 3. Mock Notion Upsert checks
        // We have 2 metrics to upsert ('Subscribers', 'Views') for 1 valid project.
        // Let's say Subscribers already exists, Views does not.
        (notion.databases.query as jest.Mock)
            .mockResolvedValueOnce({ results: [{ id: 'existing-sub-page' }] }) // For Subscribers
            .mockResolvedValueOnce({ results: [] }); // For Views

        // 4. Run the Cron
        const response = await GET(authReq as any);
        expect(response.status).toBe(200);

        // Assert Provider was invoked correctly
        expect(getMetricsProvider).toHaveBeenCalledWith('youtube');
        expect(mockYouTubeProvider.getMetrics).toHaveBeenCalledWith('yt-account');

        // Assert Notion DB Queries
        expect(notion.databases.query).toHaveBeenCalledTimes(2);

        // Assert Notion Pages Update (Subscribers existing row)
        expect(notion.pages.update).toHaveBeenCalledWith({
            page_id: 'existing-sub-page',
            properties: {
                'value': { number: 10000 }
            }
        });

        // Assert Notion Pages Create (Views entirely new row)
        expect(notion.pages.create).toHaveBeenCalledWith(expect.objectContaining({
            parent: { database_id: 'metrics-db-id' },
            properties: expect.objectContaining({
                'name': { title: [{ text: { content: 'Views' } }] },
                'value': { number: 500000 },
                'projects': { relation: [{ id: 'yt-123' }] },
            })
        }));
    });
});
