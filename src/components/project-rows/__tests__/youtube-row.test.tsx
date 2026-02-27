import { render, screen } from '@testing-library/react';
import { YouTubeProjectRow } from '../youtube-row';
import { ProjectDetails } from '@/lib/data-client';

const mockYoutubeProject: ProjectDetails = {
    id: 'yt-1',
    name: 'My Coding Channel',
    type: 'content',
    status: 'active',
    platform: 'youtube',
    totalRevenue: 5000,
    totalCosts: 1000,
    netProfit: 4000,
    metrics: [
        { name: 'Subscribers', value: 150000 },
        { name: 'Views', value: 2000000 },
        { name: 'Videos', value: 105 }
    ]
};

describe('YouTubeProjectRow', () => {
    it('renders project basic details, standard financials, and specific youtube metrics', () => {
        render(<YouTubeProjectRow project={mockYoutubeProject} />);

        expect(screen.getByText('My Coding Channel')).toBeInTheDocument();

        // Assert Financials
        expect(screen.getByText('$5,000')).toBeInTheDocument(); // Revenue
        expect(screen.getByText('$4,000')).toBeInTheDocument(); // Profit
        expect(screen.getByText('$1,000')).toBeInTheDocument(); // Costs

        // Assert YouTube specific metrics map to custom slots
        expect(screen.getByText('Subscribers')).toBeInTheDocument();
        expect(screen.getByText('150,000')).toBeInTheDocument();

        expect(screen.getByText('Views')).toBeInTheDocument();
        expect(screen.getByText('2,000,000')).toBeInTheDocument();

        expect(screen.getByText('Videos')).toBeInTheDocument();
        expect(screen.getByText('105')).toBeInTheDocument();
    });
});
