import { render, screen } from '@testing-library/react';
import ExpensesPage from '../page';
import { getDataClient } from '@/lib/client-factory';

jest.mock('@/lib/client-factory', () => ({
    getDataClient: jest.fn(),
}));

jest.mock('next/link', () => {
    return ({ children, href }: any) => <a href={href}>{children}</a>;
});

const mockExpenses = [
    {
        id: 'e1', amount: 20, vendor: 'Vercel', category: 'infrastructure',
        date: '2025-01-01', source: 'manual', recurring: true, currency: 'USD',
        createdAt: '2025-01-01T00:00:00Z',
        allocations: [{ projectId: 'proj-a', projectName: 'SaaS App', allocation: 1 }],
    },
    {
        id: 'e2', amount: 150, vendor: 'Office Supplies', category: 'other',
        date: '2025-02-15', source: 'manual', recurring: false, currency: 'USD',
        createdAt: '2025-02-15T00:00:00Z',
        allocations: [],
    },
];

const mockSummary = {
    totalAmount: 170,
    count: 2,
    byCategory: { infrastructure: 20, other: 150 },
    byVendor: { Vercel: 20, 'Office Supplies': 150 },
};

describe('ExpensesPage', () => {
    it('renders summary cards and expense rows', async () => {
        (getDataClient as jest.Mock).mockReturnValue({
            getExpenses: jest.fn().mockResolvedValue(mockExpenses),
            getExpenseSummary: jest.fn().mockResolvedValue(mockSummary),
        });

        const page = await ExpensesPage();
        render(page);

        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Expenses');
        expect(screen.getByText('$170')).toBeInTheDocument();
        expect(screen.getAllByText('Vercel').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Office Supplies').length).toBeGreaterThan(0);
    });

    it('shows unallocated badge for expenses with no projects', async () => {
        (getDataClient as jest.Mock).mockReturnValue({
            getExpenses: jest.fn().mockResolvedValue(mockExpenses),
            getExpenseSummary: jest.fn().mockResolvedValue(mockSummary),
        });

        const page = await ExpensesPage();
        render(page);

        expect(screen.getByText('Unallocated')).toBeInTheDocument();
    });

    it('shows project tags for allocated expenses', async () => {
        (getDataClient as jest.Mock).mockReturnValue({
            getExpenses: jest.fn().mockResolvedValue(mockExpenses),
            getExpenseSummary: jest.fn().mockResolvedValue(mockSummary),
        });

        const page = await ExpensesPage();
        render(page);

        expect(screen.getByText('SaaS App')).toBeInTheDocument();
    });

    it('shows empty state when no expenses', async () => {
        (getDataClient as jest.Mock).mockReturnValue({
            getExpenses: jest.fn().mockResolvedValue([]),
            getExpenseSummary: jest.fn().mockResolvedValue({ totalAmount: 0, count: 0, byCategory: {}, byVendor: {} }),
        });

        const page = await ExpensesPage();
        render(page);

        expect(screen.getByText(/no expenses/i)).toBeInTheDocument();
    });
});
