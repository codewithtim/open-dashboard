import { GET, PUT } from '../route';

let selectResults: any[][] = [];
let selectIdx = 0;
const mockDelete = jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) });
const mockInsertValues = jest.fn().mockResolvedValue(undefined);
const mockUpdateWhere = jest.fn().mockResolvedValue(undefined);

jest.mock('@/lib/db', () => ({
    getDb: jest.fn(() => ({
        select: () => ({
            from: () => ({
                where: () => Promise.resolve(selectResults[selectIdx++] || []),
            }),
        }),
        delete: () => ({
            where: mockDelete,
        }),
        insert: () => ({
            values: mockInsertValues,
        }),
        update: () => ({
            set: () => ({
                where: mockUpdateWhere,
            }),
        }),
    })),
}));

jest.mock('next/server', () => ({
    NextResponse: {
        json: (body: any, init?: any) => ({
            status: init?.status || 200,
            json: async () => body,
        }),
    },
}));

const originalEnv = process.env;
const params = Promise.resolve({ id: 'agt_1' });

function authedReq() {
    return { headers: { get: (n: string) => n === 'authorization' ? 'Bearer test-key' : null } } as any;
}

function putReq(body: any, auth = true) {
    return {
        headers: { get: (n: string) => n === 'authorization' ? (auth ? 'Bearer test-key' : null) : null },
        json: async () => body,
    } as any;
}

beforeEach(() => {
    jest.clearAllMocks();
    selectIdx = 0;
    selectResults = [[{ repoFullName: 'owner/repo' }]];
    process.env = { ...originalEnv, AGENT_API_KEY: 'test-key' };
});

afterAll(() => {
    process.env = originalEnv;
});

describe('GET /api/agents/[id]/repos', () => {
    it('returns 401 without auth', async () => {
        const req = { headers: { get: () => null } } as any;
        const response = await GET(req, { params });
        expect(response.status).toBe(401);
    });

    it('returns repos for agent', async () => {
        const response = await GET(authedReq(), { params });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.repos).toEqual(['owner/repo']);
    });

    it('returns empty array when no repos', async () => {
        selectResults = [[]];
        const response = await GET(authedReq(), { params });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.repos).toEqual([]);
    });
});

describe('PUT /api/agents/[id]/repos', () => {
    it('returns 401 without auth', async () => {
        const response = await PUT(putReq({ repos: [] }, false), { params });
        expect(response.status).toBe(401);
    });

    it('replaces repos', async () => {
        selectResults = [[{ id: 'agt_1' }]];
        const response = await PUT(putReq({ repos: ['owner/new-repo', 'owner/other'] }), { params });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.repos).toEqual(['owner/new-repo', 'owner/other']);
    });

    it('returns 400 for invalid repo format', async () => {
        selectResults = [[{ id: 'agt_1' }]];
        const response = await PUT(putReq({ repos: ['invalid-no-slash'] }), { params });
        expect(response.status).toBe(400);
    });

    it('returns 404 for unknown agent ID', async () => {
        selectResults = [[]];
        const response = await PUT(putReq({ repos: ['owner/repo'] }), { params });
        expect(response.status).toBe(404);
    });
});
