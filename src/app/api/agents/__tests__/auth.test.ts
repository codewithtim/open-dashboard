import { requireAgentAuth } from '../_lib/auth';

jest.mock('next/server', () => ({
    NextResponse: {
        json: (body: any, init?: any) => ({
            status: init?.status || 200,
            json: async () => body,
        }),
    },
}));

describe('requireAgentAuth', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv, AGENT_API_KEY: 'test-key' };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('returns 401 when no authorization header', () => {
        const request = new Request('http://localhost/api/agents', {
            headers: {},
        });
        const result = requireAgentAuth(request);
        expect(result).not.toBeNull();
        expect(result!.status).toBe(401);
    });

    it('returns 401 when token is wrong', () => {
        const request = new Request('http://localhost/api/agents', {
            headers: { authorization: 'Bearer wrong-key' },
        });
        const result = requireAgentAuth(request);
        expect(result).not.toBeNull();
        expect(result!.status).toBe(401);
    });

    it('returns null when token is correct', () => {
        const request = new Request('http://localhost/api/agents', {
            headers: { authorization: 'Bearer test-key' },
        });
        const result = requireAgentAuth(request);
        expect(result).toBeNull();
    });
});
