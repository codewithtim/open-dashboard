import { render, screen } from '@testing-library/react';
import ToolDetailPage from '../page';
import { getDataClient } from '@/lib/client-factory';
import { notFound } from 'next/navigation';

jest.mock('@/lib/client-factory', () => ({
    getDataClient: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    notFound: jest.fn(),
}));

jest.mock('next/link', () => {
    return ({ children, href }: any) => <a href={href}>{children}</a>;
});

jest.mock('@/components/tool-icon', () => ({
    ToolIcon: ({ fallback, className }: any) => <span className={className}>{fallback}</span>,
}));

describe('ToolDetailPage', () => {
    it('renders tool details with referral link and related projects', async () => {
        const mockClient = {
            getToolBySlug: jest.fn().mockResolvedValue({
                id: 'tool-1',
                name: 'Vercel',
                slug: 'vercel',
                category: 'hosting',
                description: 'Cloud platform for deploying frontend apps.',
                iconKey: 'SiVercel',
                recommended: true,
                referralUrl: 'https://vercel.com',
                projectIds: ['p1'],
            }),
            getMultipleProjectDetails: jest.fn().mockResolvedValue([
                { id: 'p1', name: 'My SaaS App', type: 'software', status: 'active', totalRevenue: 0, totalCosts: 0, netProfit: 0, metrics: [] },
            ]),
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);

        const page = await ToolDetailPage({ params: Promise.resolve({ slug: 'vercel' }) });
        render(page);

        expect(screen.getByText('Vercel')).toBeInTheDocument();
        expect(screen.getByText('hosting')).toBeInTheDocument();
        expect(screen.getByText('Recommended')).toBeInTheDocument();
        expect(screen.getByText('Cloud platform for deploying frontend apps.')).toBeInTheDocument();
        expect(screen.getByText('Try Vercel')).toBeInTheDocument();

        const ctaLink = screen.getByText('Try Vercel').closest('a');
        expect(ctaLink).toHaveAttribute('href', 'https://vercel.com');

        expect(screen.getByText('My SaaS App')).toBeInTheDocument();
    });

    it('calls notFound when tool does not exist', async () => {
        const mockClient = {
            getToolBySlug: jest.fn().mockResolvedValue(null),
            getMultipleProjectDetails: jest.fn().mockResolvedValue([]),
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);

        (notFound as unknown as jest.Mock).mockImplementation(() => {
            throw new Error('NEXT_NOT_FOUND');
        });

        await expect(
            ToolDetailPage({ params: Promise.resolve({ slug: 'nonexistent' }) })
        ).rejects.toThrow('NEXT_NOT_FOUND');

        expect(notFound).toHaveBeenCalled();
    });
});
