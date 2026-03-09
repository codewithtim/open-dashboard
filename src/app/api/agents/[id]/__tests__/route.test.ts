import { GET, PATCH } from '../route';

const mockAgent = {
    id: 'agt_1',
    name: 'Operator',
    identifier: 'Operator',
    description: 'A bot',
    status: 'idle',
    currentTask: null,
    lastSeenAt: '2026-03-10T00:00:00Z',
    createdAt: '2026-03-10T00:00:00Z',
};

const mockUpdate = jest.fn();

let selectResults: any[][] = [];
let selectIdx = 0;

jest.mock('@/lib/db', () => ({
    getDb: jest.fn(() => ({
        select: () => ({
            from: () => ({
                where: () => Promise.resolve(selectResults[selectIdx++] || []),
            }),
        }),
        update: () => ({
            set: () => ({
                where: mockUpdate.mockResolvedValue(undefined),
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

function patchReq(body: any, auth = true) {
    return {
        headers: { get: (n: string) => n === 'authorization' ? (auth ? 'Bearer test-key' : null) : null },
        json: async () => body,
    } as any;
}

beforeEach(() => {
    jest.clearAllMocks();
    selectIdx = 0;
    // Default: GET agent returns agent, repos, projects
    // PATCH returns agent (exists check), then agent (after update)
    selectResults = [
        [mockAgent],
        [{ repoFullName: 'owner/repo' }],
        [{ projectId: 'proj-1' }],
        [mockAgent],
    ];
    process.env = { ...originalEnv, AGENT_API_KEY: 'test-key' };
});

afterAll(() => {
    process.env = originalEnv;
});

describe('GET /api/agents/[id]', () => {
    it('returns 401 without auth', async () => {
        const req = { headers: { get: () => null } } as any;
        const response = await GET(req, { params });
        expect(response.status).toBe(401);
    });

    it('returns agent with repos and projects', async () => {
        const response = await GET(authedReq(), { params });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.id).toBe('agt_1');
        expect(data.repos).toEqual(['owner/repo']);
        expect(data.projectIds).toEqual(['proj-1']);
    });

    it('returns 404 for unknown ID', async () => {
        selectResults = [[], [], [], []];
        const response = await GET(authedReq(), { params });
        expect(response.status).toBe(404);
    });
});

describe('PATCH /api/agents/[id]', () => {
    it('returns 401 without auth', async () => {
        const response = await PATCH(patchReq({}, false), { params });
        expect(response.status).toBe(401);
    });

    it('updates name and description', async () => {
        selectResults = [[mockAgent], [mockAgent]];
        const response = await PATCH(patchReq({ name: 'NewName', description: 'Updated' }), { params });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.id).toBe('agt_1');
    });

    it('updates status to valid value', async () => {
        selectResults = [[mockAgent], [mockAgent]];
        const response = await PATCH(patchReq({ status: 'working' }), { params });
        expect(response.status).toBe(200);
    });

    it('returns 400 for invalid status value', async () => {
        const response = await PATCH(patchReq({ status: 'invalid' }), { params });
        expect(response.status).toBe(400);
    });

    it('returns 404 for unknown ID', async () => {
        selectResults = [[], [], [], []];
        const response = await PATCH(patchReq({ name: 'X' }), { params });
        expect(response.status).toBe(404);
    });
});
