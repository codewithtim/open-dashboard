import { GET } from '../route';

jest.mock('next/server', () => ({
    NextResponse: {
        json: (body: any, init?: any) => ({
            status: init?.status || 200,
            json: async () => body,
        }),
    },
}));

describe('GET /api/agents/openapi', () => {
    it('returns OpenAPI spec without auth', async () => {
        const response = await GET();
        expect(response.status).toBe(200);
    });

    it('response has openapi and paths keys', async () => {
        const response = await GET();
        const data = await response.json();
        expect(data.openapi).toBeDefined();
        expect(data.paths).toBeDefined();
    });
});
