import { GET, PUT } from '../route';

const mockGetProjectServices = jest.fn();
const mockUpdateProjectServices = jest.fn();

jest.mock('@/lib/client-factory', () => ({
    getDataClient: jest.fn(() => ({
        getProjectServices: mockGetProjectServices,
        updateProjectServices: mockUpdateProjectServices,
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

function mockRequest(body: any) {
    return { json: async () => body } as any;
}

const params = Promise.resolve({ id: 'proj-a' });

describe('GET /api/projects/[id]/services', () => {
    it('returns services for the project', async () => {
        const services = [{ id: 'ps-1', projectId: 'proj-a', vendor: 'Vercel', exclusive: true }];
        mockGetProjectServices.mockResolvedValue(services);

        const response = await GET(new Request('http://localhost'), { params });
        const data = await response.json();

        expect(data).toEqual(services);
        expect(mockGetProjectServices).toHaveBeenCalledWith('proj-a');
    });
});

describe('PUT /api/projects/[id]/services', () => {
    beforeEach(() => jest.clearAllMocks());

    it('replaces services and returns 200', async () => {
        mockUpdateProjectServices.mockResolvedValue(undefined);
        mockGetProjectServices.mockResolvedValue([
            { id: 'ps-new', projectId: 'proj-a', vendor: 'AWS', exclusive: false },
        ]);

        const response = await PUT(
            mockRequest({ services: [{ vendor: 'AWS', exclusive: false }] }),
            { params },
        );

        expect(response.status).toBe(200);
        expect(mockUpdateProjectServices).toHaveBeenCalledWith('proj-a', [{ vendor: 'AWS', exclusive: false }]);
    });

    it('returns 400 for missing services array', async () => {
        const response = await PUT(mockRequest({}), { params });
        expect(response.status).toBe(400);
    });
});
