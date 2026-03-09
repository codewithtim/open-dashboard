import { POST } from '../route';

const mockAgent = {
    id: 'agt_1',
    name: 'Operator',
    identifier: 'Operator',
    status: 'working',
    currentTask: 'Building feature X',
    lastSeenAt: '2026-03-10T12:00:00Z',
    createdAt: '2026-03-10T00:00:00Z',
};

let selectResults: any[][] = [];
let selectIdx = 0;
const mockUpdate = jest.fn();

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

function postReq(body: any, auth = true) {
    return {
        headers: { get: (n: string) => n === 'authorization' ? (auth ? 'Bearer test-key' : null) : null },
        json: async () => body,
    } as any;
}

beforeEach(() => {
    jest.clearAllMocks();
    selectIdx = 0;
    selectResults = [[mockAgent], [mockAgent]];
    process.env = { ...originalEnv, AGENT_API_KEY: 'test-key' };
});

afterAll(() => {
    process.env = originalEnv;
});

describe('POST /api/agents/[id]/heartbeat', () => {
    it('returns 401 without auth', async () => {
        const response = await POST(postReq({}, false), { params });
        expect(response.status).toBe(401);
    });

    it('updates status and currentTask', async () => {
        const response = await POST(postReq({ status: 'working', currentTask: 'Building feature X' }), { params });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.id).toBe('agt_1');
        expect(data.status).toBe('working');
        expect(data.lastSeenAt).toBeDefined();
    });

    it('clears currentTask when null', async () => {
        const agentWithNull = { ...mockAgent, currentTask: null };
        selectResults = [[mockAgent], [agentWithNull]];
        const response = await POST(postReq({ currentTask: null }), { params });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.currentTask).toBeNull();
    });

    it('returns 404 for unknown ID', async () => {
        selectResults = [[]];
        const response = await POST(postReq({ status: 'idle' }), { params });
        expect(response.status).toBe(404);
    });
});
