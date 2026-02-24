import { render, screen } from '@testing-library/react';
import { TikTokProjectRow } from '../tiktok-row';
import { ProjectDetails } from '@/lib/data-client';

const mockTiktokProject: ProjectDetails = {
    id: 'tt-1',
    name: 'My TikTok',
    type: 'Social',
    status: 'Active',
    totalRevenue: 1500,
    totalCosts: 200,
    netProfit: 1300,
    metrics: [
        { name: 'Followers', value: 50000 },
        { name: 'Likes', value: 2000000 },
        { name: 'Views', value: 10000000 }
    ]
};

describe('TikTokProjectRow', () => {
    it('renders project basic details and specific social metrics', () => {
        render(<TikTokProjectRow project={mockTiktokProject} />);

        expect(screen.getByText('My TikTok')).toBeInTheDocument();
        expect(screen.getByText('Social')).toBeInTheDocument();

        // Assert Financials
        expect(screen.getByText('$1,500')).toBeInTheDocument();
        expect(screen.getByText('$1,300')).toBeInTheDocument();
        expect(screen.getByText('$200')).toBeInTheDocument(); // Costs

        // Assert Socials
        expect(screen.getByText('Followers')).toBeInTheDocument();
        expect(screen.getByText('50,000')).toBeInTheDocument();
        expect(screen.getByText('Likes')).toBeInTheDocument();
        expect(screen.getByText('2,000,000')).toBeInTheDocument();
        expect(screen.getByText('Views')).toBeInTheDocument();
        expect(screen.getByText('10,000,000')).toBeInTheDocument();
    });
});
