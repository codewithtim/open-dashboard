import { GET, POST } from '../route';

const mockGetExpenses = jest.fn();
const mockCreateExpense = jest.fn();
const mockGetAllProjectServices = jest.fn();

jest.mock('@/lib/client-factory', () => ({
    getDataClient: jest.fn(() => ({
        getExpenses: mockGetExpenses,
        createExpense: mockCreateExpense,
        getAllProjectServices: mockGetAllProjectServices,
    })),
}));

jest.mock('@/lib/domain/cost-linker', () => ({
    linkCostToProjects: jest.fn(() => [{ projectId: 'proj-a', allocation: 1 }]),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
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

describe('GET /api/expenses', () => {
    it('returns expenses', async () => {
        const mockExpenses = [{ id: 'e1', amount: 20, vendor: 'Vercel' }];
        mockGetExpenses.mockResolvedValue(mockExpenses);

        const response = await GET();
        const data = await response.json();

        expect(data).toEqual(mockExpenses);
    });
});

describe('POST /api/expenses', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetAllProjectServices.mockResolvedValue([]);
    });

    it('creates expense with auto-linked allocations and returns 201', async () => {
        const created = { id: 'e1', amount: 50, vendor: 'AWS', category: 'infrastructure', allocations: [{ projectId: 'proj-a', allocation: 1 }] };
        mockCreateExpense.mockResolvedValue(created);

        const response = await POST(mockRequest({ amount: 50, vendor: 'AWS', category: 'infrastructure', date: '2025-03-01' }));
        expect(response.status).toBe(201);

        const data = await response.json();
        expect(data.vendor).toBe('AWS');
    });

    it('uses provided allocations when specified', async () => {
        const created = { id: 'e2', amount: 100, vendor: 'GitHub', allocations: [{ projectId: 'proj-b', allocation: 0.5 }] };
        mockCreateExpense.mockResolvedValue(created);

        const response = await POST(mockRequest({
            amount: 100, vendor: 'GitHub', category: 'tooling', date: '2025-03-01',
            allocations: [{ projectId: 'proj-b', allocation: 0.5 }],
        }));
        expect(response.status).toBe(201);
        expect(mockCreateExpense).toHaveBeenCalledWith(
            expect.objectContaining({ amount: 100, vendor: 'GitHub' }),
            [{ projectId: 'proj-b', allocation: 0.5 }],
        );
    });

    it('returns 400 for missing required fields', async () => {
        const response = await POST(mockRequest({ vendor: 'AWS' }));
        expect(response.status).toBe(400);
    });

    it('returns 400 for invalid category', async () => {
        const response = await POST(mockRequest({ amount: 50, vendor: 'AWS', category: 'invalid', date: '2025-03-01' }));
        expect(response.status).toBe(400);
    });
});
