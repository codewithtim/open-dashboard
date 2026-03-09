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

function authedRequest() {
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

describe('GET /api/companies', () => {
    it('returns 401 without auth', async () => {
        const request = { headers: { get: () => null } } as any;
        const response = await GET(request);
        expect(response.status).toBe(401);
    });

    it('returns empty array when no companies', async () => {
        const response = await GET(authedRequest());
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual([]);
    });
});

describe('POST /api/companies', () => {
    it('returns 401 without auth', async () => {
        const response = await POST(postRequest({ name: 'Test', slug: 'test' }, false));
        expect(response.status).toBe(401);
    });

    it('creates company with valid body', async () => {
        const response = await POST(postRequest({ name: 'OpenAI', slug: 'openai', website: 'https://openai.com' }));
        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data.id).toMatch(/^comp_/);
        expect(data.name).toBe('OpenAI');
        expect(data.slug).toBe('openai');
        expect(data.website).toBe('https://openai.com');
    });

    it('returns 400 when name is missing', async () => {
        const response = await POST(postRequest({ slug: 'test' }));
        expect(response.status).toBe(400);
    });

    it('returns 400 when slug is missing', async () => {
        const response = await POST(postRequest({ name: 'Test' }));
        expect(response.status).toBe(400);
    });

    it('returns 400 for invalid slug format', async () => {
        const response = await POST(postRequest({ name: 'Test', slug: 'Invalid Slug!' }));
        expect(response.status).toBe(400);
    });

    it('returns 409 when slug already exists', async () => {
        mockRows = [{ id: 'comp_existing' }];
        const response = await POST(postRequest({ name: 'OpenAI', slug: 'openai' }));
        expect(response.status).toBe(409);
    });
});
