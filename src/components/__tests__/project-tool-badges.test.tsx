import { render, screen } from '@testing-library/react';
import { ProjectToolBadges } from '../project-tool-badges';
import { Tool } from '@/lib/data-client';

jest.mock('next/link', () => {
    return ({ children, href, title }: any) => <a href={href} title={title}>{children}</a>;
});

const mockTools: Tool[] = [
    {
        id: 'tool-1',
        name: 'Vercel',
        slug: 'vercel',
        category: 'hosting',
        description: 'Cloud platform',
        iconKey: 'SiVercel',
        recommended: true,
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
];

describe('ProjectToolBadges', () => {
    it('renders tool icons with links to detail pages', () => {
        render(<ProjectToolBadges tools={mockTools} />);

        expect(screen.getByText('Tools')).toBeInTheDocument();
        const links = screen.getAllByRole('link');
        expect(links).toHaveLength(2);
        expect(links[0]).toHaveAttribute('href', '/tools/vercel');
        expect(links[1]).toHaveAttribute('href', '/tools/stripe');
    });

    it('returns null when tools array is empty', () => {
        const { container } = render(<ProjectToolBadges tools={[]} />);
        expect(container.innerHTML).toBe('');
    });

    it('renders tool name as fallback when icon key is unknown', () => {
        const toolWithBadKey: Tool[] = [{
            id: 'tool-3',
            name: 'CustomTool',
            slug: 'custom',
            category: 'other',
            description: 'desc',
            iconKey: 'SiUnknown',
            recommended: false,
            projectIds: ['p1'],
        }];
        render(<ProjectToolBadges tools={toolWithBadKey} />);
        expect(screen.getByText('CustomTool')).toBeInTheDocument();
    });
});
