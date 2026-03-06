import { TursoClient } from '../turso-client';

let mockSelectResult: any[] = [];

// Create a "thenable" chain node that resolves to result and has all chainable methods
function chainNode(result: any[]): any {
    const node: any = {
        then: (resolve: any, reject?: any) => Promise.resolve(result).then(resolve, reject),
        where: jest.fn().mockImplementation(() => chainNode(result)),
        from: jest.fn().mockImplementation(() => chainNode(result)),
        leftJoin: jest.fn().mockImplementation(() => chainNode(result)),
        groupBy: jest.fn().mockImplementation(() => chainNode(result)),
        orderBy: jest.fn().mockImplementation(() => chainNode(result)),
        limit: jest.fn().mockImplementation(() => chainNode(result)),
        map: (fn: any) => result.map(fn),
    };
    return node;
}

const mockInsertValues = jest.fn().mockReturnValue({
    onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
    onConflictDoNothing: jest.fn().mockResolvedValue(undefined),
});
const mockInsert = jest.fn().mockReturnValue({
    values: mockInsertValues,
});

const mockDeleteWhere = jest.fn().mockResolvedValue(undefined);
const mockDelete = jest.fn().mockReturnValue({
    where: mockDeleteWhere,
});

const mockSelect = jest.fn().mockImplementation(() => chainNode(mockSelectResult));

jest.mock('@/lib/db', () => ({
    getDb: jest.fn(() => ({
        insert: mockInsert,
        select: mockSelect,
        delete: mockDelete,
    })),
}));

describe('TursoClient — Expenses', () => {
    let client: TursoClient;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSelectResult = [];
        client = new TursoClient();
    });

    describe('getExpenses', () => {
        it('calls select and returns expenses with assembled allocations', async () => {
            mockSelectResult = [
                {
                    id: 'exp-1', amount: 20, vendor: 'Vercel', category: 'infrastructure',
                    note: null, date: '2025-01-01', periodStart: null, periodEnd: null,
                    source: 'manual', sourceRef: null, recurring: false, currency: 'USD',
                    createdAt: '2025-01-01T00:00:00Z',
                    allocationProjectId: 'proj-a', allocation: 1, projectName: 'SaaS App',
                },
            ];

            const expenses = await client.getExpenses();
            expect(mockSelect).toHaveBeenCalled();
            expect(expenses).toHaveLength(1);
            expect(expenses[0].id).toBe('exp-1');
            expect(expenses[0].allocations).toEqual([
                { projectId: 'proj-a', projectName: 'SaaS App', allocation: 1 },
            ]);
        });

        it('groups multiple allocation rows into one expense', async () => {
            mockSelectResult = [
                {
                    id: 'exp-2', amount: 10, vendor: 'GitHub', category: 'tooling',
                    note: null, date: '2025-01-01', periodStart: null, periodEnd: null,
                    source: 'manual', sourceRef: null, recurring: true, currency: 'USD',
                    createdAt: '2025-01-01T00:00:00Z',
                    allocationProjectId: 'proj-a', allocation: 0.5, projectName: 'App A',
                },
                {
                    id: 'exp-2', amount: 10, vendor: 'GitHub', category: 'tooling',
                    note: null, date: '2025-01-01', periodStart: null, periodEnd: null,
                    source: 'manual', sourceRef: null, recurring: true, currency: 'USD',
                    createdAt: '2025-01-01T00:00:00Z',
                    allocationProjectId: 'proj-b', allocation: 0.5, projectName: 'App B',
                },
            ];

            const expenses = await client.getExpenses();
            expect(expenses).toHaveLength(1);
            expect(expenses[0].allocations).toHaveLength(2);
        });
    });

    describe('getExpensesByProject', () => {
        it('calls select with project filter', async () => {
            mockSelectResult = [];
            const expenses = await client.getExpensesByProject('proj-a');
            expect(mockSelect).toHaveBeenCalled();
            expect(expenses).toEqual([]);
        });
    });

    describe('createExpense', () => {
        it('inserts expense and allocations', async () => {
            const input = {
                amount: 50,
                vendor: 'AWS',
                category: 'infrastructure' as const,
                date: '2025-03-01',
            };
            const allocations = [{ projectId: 'proj-a', allocation: 1 }];

            const expense = await client.createExpense(input, allocations);
            expect(mockInsert).toHaveBeenCalled();
            expect(expense.amount).toBe(50);
            expect(expense.vendor).toBe('AWS');
            expect(expense.allocations).toEqual(allocations);
        });
    });

    describe('getExpenseSummary', () => {
        it('returns summary with totals', async () => {
            mockSelectResult = [
                { id: 'e1', amount: 100, category: 'infrastructure', vendor: 'AWS' },
                { id: 'e2', amount: 50, category: 'tooling', vendor: 'GitHub' },
            ];

            const summary = await client.getExpenseSummary();
            expect(summary.totalAmount).toBe(150);
            expect(summary.count).toBe(2);
            expect(summary.byCategory).toEqual({ infrastructure: 100, tooling: 50 });
            expect(summary.byVendor).toEqual({ AWS: 100, GitHub: 50 });
        });
    });

    describe('getProjectServices', () => {
        it('returns services for a project', async () => {
            mockSelectResult = [
                { id: 'ps-1', projectId: 'proj-a', vendor: 'Vercel', exclusive: true },
            ];

            const services = await client.getProjectServices('proj-a');
            expect(services).toEqual([
                { id: 'ps-1', projectId: 'proj-a', vendor: 'Vercel', exclusive: true },
            ]);
        });
    });

    describe('getAllProjectServices', () => {
        it('returns all services', async () => {
            mockSelectResult = [
                { id: 'ps-1', projectId: 'proj-a', vendor: 'Vercel', exclusive: true },
                { id: 'ps-2', projectId: 'proj-b', vendor: 'GitHub', exclusive: false },
            ];

            const services = await client.getAllProjectServices();
            expect(services).toHaveLength(2);
        });
    });

    describe('updateProjectServices', () => {
        it('deletes existing and inserts new services', async () => {
            await client.updateProjectServices('proj-a', [
                { vendor: 'Vercel', exclusive: true },
            ]);
            expect(mockDelete).toHaveBeenCalled();
            expect(mockInsert).toHaveBeenCalled();
        });
    });
});
