import { GET, PUT } from '../route';

let selectResults: any[][] = [];
let selectIdx = 0;
const mockDelete = jest.fn().mockResolvedValue(undefined);
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
    selectResults = [[{ projectId: 'proj-1' }]];
    process.env = { ...originalEnv, AGENT_API_KEY: 'test-key' };
});

afterAll(() => {
    process.env = originalEnv;
});

describe('GET /api/agents/[id]/projects', () => {
    it('returns 401 without auth', async () => {
        const req = { headers: { get: () => null } } as any;
        const response = await GET(req, { params });
        expect(response.status).toBe(401);
    });

    it('returns project IDs for agent', async () => {
        const response = await GET(authedReq(), { params });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.projectIds).toEqual(['proj-1']);
    });
});

describe('PUT /api/agents/[id]/projects', () => {
    it('returns 401 without auth', async () => {
        const response = await PUT(putReq({ projectIds: [] }, false), { params });
        expect(response.status).toBe(401);
    });

    it('replaces project assignments', async () => {
        // idx 0: agent exists check, idx 1: projects exist check
        selectResults = [[{ id: 'agt_1' }], [{ id: 'proj-1' }, { id: 'proj-2' }]];
        const response = await PUT(putReq({ projectIds: ['proj-1', 'proj-2'] }), { params });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.projectIds).toEqual(['proj-1', 'proj-2']);
    });

    it('returns 400 when project ID does not exist', async () => {
        // idx 0: agent exists, idx 1: only proj-1 found (proj-999 missing)
        selectResults = [[{ id: 'agt_1' }], [{ id: 'proj-1' }]];
        const response = await PUT(putReq({ projectIds: ['proj-1', 'proj-999'] }), { params });
        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain('proj-999');
    });

    it('returns 404 for unknown agent ID', async () => {
        selectResults = [[]];
        const response = await PUT(putReq({ projectIds: ['proj-1'] }), { params });
        expect(response.status).toBe(404);
    });
});
