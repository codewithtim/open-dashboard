import { render, screen } from '@testing-library/react';
import { TwitchProjectRow } from '../twitch-row';
import { ProjectDetails } from '@/lib/data-client';

const mockTwitchProject: ProjectDetails = {
    id: 'tw-1',
    name: 'My Twitch',
    type: 'Streaming',
    status: 'Active',
    totalRevenue: 3000,
    totalCosts: 500,
    netProfit: 2500,
    metrics: [
        { name: 'Followers', value: 15000 },
        { name: 'Subscribers', value: 500 },
        { name: 'Views', value: 300000 }
    ]
};

describe('TwitchProjectRow', () => {
    it('renders project basic details and specific social metrics', () => {
        render(<TwitchProjectRow project={mockTwitchProject} />);

        expect(screen.getByText('My Twitch')).toBeInTheDocument();
        expect(screen.getByText('Streaming')).toBeInTheDocument();

        // Assert Financials
        expect(screen.getByText('$3,000')).toBeInTheDocument();
        expect(screen.getByText('$2,500')).toBeInTheDocument();
        expect(screen.getByText('$500')).toBeInTheDocument(); // Costs

        // Assert Socials
        expect(screen.getByText('Followers')).toBeInTheDocument();
        expect(screen.getByText('15,000')).toBeInTheDocument();
        expect(screen.getByText('Subscribers')).toBeInTheDocument();
        expect(screen.getByText('500')).toBeInTheDocument();
        expect(screen.getByText('Views')).toBeInTheDocument();
        expect(screen.getByText('300,000')).toBeInTheDocument();
    });
});
