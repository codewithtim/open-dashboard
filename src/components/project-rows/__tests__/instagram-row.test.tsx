import { render, screen } from '@testing-library/react';
import { InstagramProjectRow } from '../instagram-row';
import { ProjectDetails } from '@/lib/data-client';

const mockInstagramProject: ProjectDetails = {
    id: 'ig-1',
    name: 'My Instagram',
    type: 'Social',
    status: 'Active',
    totalRevenue: 800,
    totalCosts: 150,
    netProfit: 650,
    metrics: [
        { name: 'Followers', value: 85000 },
        { name: 'Likes', value: 1200000 },
        { name: 'Reach', value: 4500000 }
    ]
};

describe('InstagramProjectRow', () => {
    it('renders project basic details and specific social metrics', () => {
        render(<InstagramProjectRow project={mockInstagramProject} />);

        expect(screen.getByText('My Instagram')).toBeInTheDocument();
        expect(screen.getByText('Social')).toBeInTheDocument();

        // Assert Financials
        expect(screen.getByText('$800')).toBeInTheDocument();
        expect(screen.getByText('$650')).toBeInTheDocument();
        expect(screen.getByText('$150')).toBeInTheDocument(); // Costs

        // Assert Socials
        expect(screen.getByText('Followers')).toBeInTheDocument();
        expect(screen.getByText('85,000')).toBeInTheDocument();
        expect(screen.getByText('Likes')).toBeInTheDocument();
        expect(screen.getByText('1,200,000')).toBeInTheDocument();
        expect(screen.getByText('Reach')).toBeInTheDocument();
        expect(screen.getByText('4,500,000')).toBeInTheDocument();
    });
});
