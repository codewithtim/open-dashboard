import { LocalMockClient } from '../local-mock-client';

describe('LocalMockClient — Expenses', () => {
    let client: LocalMockClient;

    beforeEach(() => {
        client = new LocalMockClient();
    });

    describe('getExpenses', () => {
        it('returns all mock expenses', async () => {
            const expenses = await client.getExpenses();
            expect(expenses.length).toBeGreaterThan(0);
            for (const e of expenses) {
                expect(e).toHaveProperty('id');
                expect(e).toHaveProperty('amount');
                expect(e).toHaveProperty('vendor');
                expect(e).toHaveProperty('category');
                expect(e).toHaveProperty('date');
                expect(e).toHaveProperty('allocations');
            }
        });
    });

    describe('getExpensesByProject', () => {
        it('returns expenses allocated to a project', async () => {
            const expenses = await client.getExpensesByProject('saas-starter');
            expect(expenses.length).toBeGreaterThan(0);
            for (const e of expenses) {
                expect(e.allocations.some(a => a.projectId === 'saas-starter')).toBe(true);
            }
        });

        it('returns empty array for project with no expenses', async () => {
            const expenses = await client.getExpensesByProject('nonexistent');
            expect(expenses).toEqual([]);
        });
    });

    describe('createExpense', () => {
        it('creates an expense with allocations and returns it', async () => {
            const input = {
                amount: 99.99,
                vendor: 'TestVendor',
                category: 'tooling' as const,
                date: '2025-03-01',
            };
            const allocations = [{ projectId: 'saas-starter', allocation: 1 }];

            const expense = await client.createExpense(input, allocations);
            expect(expense.id).toBeDefined();
            expect(expense.amount).toBe(99.99);
            expect(expense.vendor).toBe('TestVendor');
            expect(expense.category).toBe('tooling');
            expect(expense.allocations).toEqual(allocations);
            expect(expense.source).toBe('manual');
            expect(expense.currency).toBe('USD');

            // Verify it's retrievable
            const all = await client.getExpenses();
            expect(all.find(e => e.id === expense.id)).toBeDefined();
        });
    });

    describe('getExpenseSummary', () => {
        it('returns correct summary shape', async () => {
            const summary = await client.getExpenseSummary();
            expect(summary.totalAmount).toBeGreaterThan(0);
            expect(summary.count).toBeGreaterThan(0);
            expect(typeof summary.byCategory).toBe('object');
            expect(typeof summary.byVendor).toBe('object');
        });

        it('sums amounts correctly', async () => {
            const expenses = await client.getExpenses();
            const summary = await client.getExpenseSummary();
            const expectedTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
            expect(summary.totalAmount).toBeCloseTo(expectedTotal);
            expect(summary.count).toBe(expenses.length);
        });
    });

    describe('getProjectServices', () => {
        it('returns services for a specific project', async () => {
            const services = await client.getProjectServices('saas-starter');
            expect(services.length).toBeGreaterThan(0);
            for (const s of services) {
                expect(s.projectId).toBe('saas-starter');
                expect(s).toHaveProperty('vendor');
                expect(s).toHaveProperty('exclusive');
            }
        });

        it('returns empty array for project with no services', async () => {
            const services = await client.getProjectServices('nonexistent');
            expect(services).toEqual([]);
        });
    });

    describe('getAllProjectServices', () => {
        it('returns all project services', async () => {
            const services = await client.getAllProjectServices();
            expect(services.length).toBeGreaterThan(0);
        });
    });

    describe('updateProjectServices', () => {
        it('replaces services for a project', async () => {
            const newServices = [
                { vendor: 'NewVendor', exclusive: true },
                { vendor: 'AnotherVendor', exclusive: false },
            ];
            await client.updateProjectServices('saas-starter', newServices);

            const services = await client.getProjectServices('saas-starter');
            expect(services).toHaveLength(2);
            expect(services.map(s => s.vendor).sort()).toEqual(['AnotherVendor', 'NewVendor']);
        });

        it('does not affect other projects', async () => {
            const before = await client.getProjectServices('npm-pkg');
            await client.updateProjectServices('saas-starter', [{ vendor: 'X', exclusive: false }]);
            const after = await client.getProjectServices('npm-pkg');
            expect(after).toEqual(before);
        });
    });
});
