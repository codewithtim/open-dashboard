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
});
