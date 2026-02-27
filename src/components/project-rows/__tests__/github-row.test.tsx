import { render, screen } from '@testing-library/react';
import { GithubProjectRow } from '../github-row';
import { ProjectDetails } from '@/lib/data-client';

const mockGithubProject: ProjectDetails = {
    id: 'gh-1',
    name: 'open-dashboard',
    type: 'software',
    status: 'active',
    platform: 'github',
    platformAccountId: 'codewithtim/open-dashboard',
    link: 'https://github.com/codewithtim/open-dashboard',
    totalRevenue: 0,
    totalCosts: 50,
    netProfit: -50,
    metrics: [
        { name: 'Stars', value: 1250 },
        { name: 'Forks', value: 85 }
    ]
};

describe('GithubProjectRow', () => {
    it('renders project basic details and specific github metrics', () => {
        render(<GithubProjectRow project={mockGithubProject} />);

        expect(screen.getByText('open-dashboard')).toBeInTheDocument();
        expect(screen.getByText('software')).toBeInTheDocument();

        // Assert Financials
        expect(screen.getByText('$0')).toBeInTheDocument();
        expect(screen.getByText('$-50')).toBeInTheDocument();
        expect(screen.getByText('$50')).toBeInTheDocument(); // Costs

        // Assert Github Stats
        expect(screen.getByText('Stars')).toBeInTheDocument();
        expect(screen.getByText('1,250')).toBeInTheDocument();
        expect(screen.getByText('Forks')).toBeInTheDocument();
        expect(screen.getByText('85')).toBeInTheDocument();
    });
});
