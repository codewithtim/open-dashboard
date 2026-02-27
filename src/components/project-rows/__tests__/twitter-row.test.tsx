import { render, screen } from '@testing-library/react';
import { TwitterProjectRow } from '../twitter-row';
import { ProjectDetails } from '@/lib/data-client';

const mockTwitterProject: ProjectDetails = {
    id: 't-1',
    name: 'My Twitter',
    type: 'social',
    status: 'active',
    totalRevenue: 500,
    totalCosts: 100,
    netProfit: 400,
    metrics: [
        { name: 'Followers', value: 10000 },
        { name: 'Impressions', value: 5000000 }
    ]
};

describe('TwitterProjectRow', () => {
    it('renders project basic details and specific social metrics', () => {
        render(<TwitterProjectRow project={mockTwitterProject} />);

        expect(screen.getByText('My Twitter')).toBeInTheDocument();
        expect(screen.getByText('social')).toBeInTheDocument();

        // Assert Financials
        expect(screen.getByText('$500')).toBeInTheDocument();
        expect(screen.getByText('$400')).toBeInTheDocument();
        expect(screen.getByText('$100')).toBeInTheDocument(); // Costs

        // Assert Socials
        expect(screen.getByText('Followers')).toBeInTheDocument();
        expect(screen.getByText('10,000')).toBeInTheDocument();
        expect(screen.getByText('Impressions')).toBeInTheDocument();
        expect(screen.getByText('5,000,000')).toBeInTheDocument();
    });
});
