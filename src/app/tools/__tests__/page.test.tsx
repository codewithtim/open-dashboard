import { render, screen } from '@testing-library/react';
import ToolsPage from '../page';
import { getDataClient } from '@/lib/client-factory';

jest.mock('@/lib/client-factory', () => ({
    getDataClient: jest.fn(),
}));

jest.mock('next/link', () => {
    return ({ children, href }: any) => <a href={href}>{children}</a>;
});

jest.mock('@/components/tool-icon', () => ({
    ToolIcon: ({ fallback, className }: any) => <span className={className}>{fallback}</span>,
}));

describe('ToolsPage', () => {
    it('renders tools grouped by category', async () => {
        const mockClient = {
            getTools: jest.fn().mockResolvedValue([
                {
                    id: 'tool-1',
                    name: 'Vercel',
                    slug: 'vercel',
                    category: 'hosting',
                    description: 'Cloud platform for deployments',
                    iconKey: 'SiVercel',
                    recommended: true,
                    referralUrl: 'https://vercel.com',
                    projectIds: ['p1'],
                },
                {
                    id: 'tool-2',
                    name: 'Stripe',
                    slug: 'stripe',
                    category: 'payments',
                    description: 'Payment processing',
                    iconKey: 'SiStripe',
                    recommended: false,
                    projectIds: ['p1'],
                },
            ]),
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);

        const page = await ToolsPage();
        render(page);

        expect(screen.getByText('Tools')).toBeInTheDocument();
        expect(screen.getByText('hosting')).toBeInTheDocument();
        expect(screen.getByText('payments')).toBeInTheDocument();
        expect(screen.getByText('Vercel')).toBeInTheDocument();
        expect(screen.getByText('Stripe')).toBeInTheDocument();
        expect(screen.getByText('Recommended')).toBeInTheDocument();

        const vercelLink = screen.getByText('Vercel').closest('a');
        expect(vercelLink).toHaveAttribute('href', '/tools/vercel');
    });
});
