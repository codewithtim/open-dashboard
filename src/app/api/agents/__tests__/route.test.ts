import { GET, POST } from '../route';

let mockRows: any[] = [];
const mockInsertValues = jest.fn().mockResolvedValue(undefined);

jest.mock('@/lib/db', () => ({
    getDb: jest.fn(() => {
        const fromResult = Object.assign(Promise.resolve(mockRows), {
            where: () => Promise.resolve(mockRows),
        });
        return {
            select: () => ({
                from: () => fromResult,
            }),
            insert: () => ({
                values: mockInsertValues,
            }),
        };
    }),
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

function authedRequest(url: string) {
    return { headers: { get: (name: string) => name === 'authorization' ? 'Bearer test-key' : null } } as any;
}

function postRequest(body: any, auth = true) {
    return {
        headers: { get: (name: string) => name === 'authorization' ? (auth ? 'Bearer test-key' : null) : null },
        json: async () => body,
    } as any;
}

beforeEach(() => {
    jest.clearAllMocks();
    mockRows = [];
    process.env = { ...originalEnv, AGENT_API_KEY: 'test-key' };
});

afterAll(() => {
    process.env = originalEnv;
});

describe('GET /api/agents', () => {
    it('returns 401 without auth', async () => {
        const request = { headers: { get: () => null } } as any;
        const response = await GET(request);
        expect(response.status).toBe(401);
    });

    it('returns empty array when no agents', async () => {
        const response = await GET(authedRequest('http://localhost/api/agents'));
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual([]);
    });
});

describe('POST /api/agents', () => {
    it('returns 401 without auth', async () => {
        const response = await POST(postRequest({ name: 'Test', identifier: 'test' }, false));
        expect(response.status).toBe(401);
    });

    it('creates agent with valid body', async () => {
        const response = await POST(postRequest({ name: 'Operator', identifier: 'Operator', description: 'A bot' }));
        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data.id).toMatch(/^agt_/);
        expect(data.name).toBe('Operator');
        expect(data.identifier).toBe('Operator');
        expect(data.status).toBe('idle');
        expect(data.lastSeenAt).toBeDefined();
        expect(data.createdAt).toBeDefined();
    });

    it('returns 400 when name is missing', async () => {
        const response = await POST(postRequest({ identifier: 'test' }));
        expect(response.status).toBe(400);
    });

    it('returns 400 when identifier is missing', async () => {
        const response = await POST(postRequest({ name: 'Test' }));
        expect(response.status).toBe(400);
    });

    it('returns 409 when identifier already exists', async () => {
        mockRows = [{ id: 'agt_existing' }];
        const response = await POST(postRequest({ name: 'Operator', identifier: 'Operator' }));
        expect(response.status).toBe(409);
    });
});
