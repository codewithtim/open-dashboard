import { render, screen } from '@testing-library/react';
import ProjectsPage from '../page';
import { getDataClient } from '@/lib/client-factory';
import React from 'react';

jest.mock('@/lib/client-factory', () => ({
    getDataClient: jest.fn(),
}));

jest.mock('next/link', () => {
    return ({ children, href }: any) => <a href={href}>{children}</a>;
});

const mockAllProjects = [
    { id: 'proj-1', name: 'SaaS App', description: 'A SaaS product.', type: 'software', status: 'active' },
    { id: 'proj-2', name: 'YouTube', description: 'Content channel.', type: 'content', status: 'active', platform: 'youtube' },
    { id: 'proj-3', name: 'Old App', description: 'Retired project.', type: 'software', status: 'archived' },
];

const mockActiveDetails = [
    { id: 'proj-1', name: 'SaaS App', description: 'A SaaS product.', type: 'software', status: 'active', totalRevenue: 68000, totalCosts: 12000, netProfit: 56000, metrics: [] },
    { id: 'proj-2', name: 'YouTube', description: 'Content channel.', type: 'content', status: 'active', platform: 'youtube', totalRevenue: 45000, totalCosts: 5000, netProfit: 40000, metrics: [] },
];

const mockArchivedDetails = [
    { id: 'proj-3', name: 'Old App', description: 'Retired project.', type: 'software', status: 'archived', totalRevenue: 0, totalCosts: 500, netProfit: -500, metrics: [] },
];

describe('Projects Page', () => {
    it('renders active project cards with links and descriptions', async () => {
        const mockClient = {
            getAllProjects: jest.fn().mockResolvedValue(mockAllProjects),
            getMultipleProjectDetails: jest.fn()
                .mockResolvedValueOnce(mockActiveDetails)
                .mockResolvedValueOnce(mockArchivedDetails),
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);

        const page = await ProjectsPage();
        render(page);

        expect(screen.getByText('All Projects')).toBeInTheDocument();

        // Names appear in h3 and ProjectTag — use getAllByText
        expect(screen.getAllByText('SaaS App').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('YouTube').length).toBeGreaterThanOrEqual(1);

        // Links to detail pages
        const saasHeading = screen.getAllByText('SaaS App').find(el => el.tagName === 'H3');
        const saasLink = saasHeading?.closest('a');
        expect(saasLink).toHaveAttribute('href', '/projects/proj-1');

        // Descriptions
        expect(screen.getByText('A SaaS product.')).toBeInTheDocument();
        expect(screen.getByText('Content channel.')).toBeInTheDocument();
    });

    it('renders archived section', async () => {
        const mockClient = {
            getAllProjects: jest.fn().mockResolvedValue(mockAllProjects),
            getMultipleProjectDetails: jest.fn()
                .mockResolvedValueOnce(mockActiveDetails)
                .mockResolvedValueOnce(mockArchivedDetails),
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);

        const page = await ProjectsPage();
        render(page);

        expect(screen.getByText('Archived')).toBeInTheDocument();
        expect(screen.getAllByText('Old App').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Retired project.')).toBeInTheDocument();
    });

    it('does not render archived section when there are no archived projects', async () => {
        const mockClient = {
            getAllProjects: jest.fn().mockResolvedValue(mockAllProjects.filter(p => p.status === 'active')),
            getMultipleProjectDetails: jest.fn()
                .mockResolvedValueOnce(mockActiveDetails)
                .mockResolvedValueOnce([]),
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);

        const page = await ProjectsPage();
        render(page);

        expect(screen.queryByText('Archived')).not.toBeInTheDocument();
    });
});
