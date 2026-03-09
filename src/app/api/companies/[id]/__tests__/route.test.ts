import { GET, PATCH } from '../route';

const mockCompany = {
    id: 'comp_1',
    name: 'OpenAI',
    slug: 'openai',
    website: 'https://openai.com',
    description: 'AI research',
    logoUrl: null,
    parentId: null,
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
const params = Promise.resolve({ id: 'comp_1' });

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
    selectResults = [
        [mockCompany],
        [],
        [],
        [mockCompany],
    ];
    process.env = { ...originalEnv, AGENT_API_KEY: 'test-key' };
});

afterAll(() => {
    process.env = originalEnv;
});

describe('GET /api/companies/[id]', () => {
    it('returns 401 without auth', async () => {
        const req = { headers: { get: () => null } } as any;
        const response = await GET(req, { params });
        expect(response.status).toBe(401);
    });

    it('returns company with children and agents', async () => {
        const mockChild = { ...mockCompany, id: 'comp_child', name: 'Sub Co', slug: 'sub-co', parentId: 'comp_1' };
        const mockAgent = { id: 'agt_1', name: 'Bot', identifier: 'bot', description: null, companyId: 'comp_1', status: 'idle', currentTask: null, lastSeenAt: null, createdAt: '2026-03-10T00:00:00Z' };
        selectResults = [
            [mockCompany],
            [mockChild],
            [mockAgent],
        ];
        const response = await GET(authedReq(), { params });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.id).toBe('comp_1');
        expect(data.children).toHaveLength(1);
        expect(data.agents).toHaveLength(1);
    });

    it('returns 404 for unknown ID', async () => {
        selectResults = [[], [], []];
        const response = await GET(authedReq(), { params });
        expect(response.status).toBe(404);
    });
});

describe('PATCH /api/companies/[id]', () => {
    it('returns 401 without auth', async () => {
        const response = await PATCH(patchReq({}, false), { params });
        expect(response.status).toBe(401);
    });

    it('updates company fields', async () => {
        selectResults = [[mockCompany], [mockCompany]];
        const response = await PATCH(patchReq({ name: 'NewName', website: 'https://new.com' }), { params });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.id).toBe('comp_1');
    });

    it('returns 404 for unknown ID', async () => {
        selectResults = [[]];
        const response = await PATCH(patchReq({ name: 'X' }), { params });
        expect(response.status).toBe(404);
    });
});
