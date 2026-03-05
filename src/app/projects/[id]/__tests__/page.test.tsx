import { render, screen } from '@testing-library/react';
import ProjectDetailPage from '../page';
import { getDataClient } from '@/lib/client-factory';
import React from 'react';

jest.mock('@/lib/client-factory', () => ({
    getDataClient: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    notFound: jest.fn(() => { throw new Error('NOT_FOUND'); }),
}));

jest.mock('next/link', () => {
    return ({ children, href }: any) => <a href={href}>{children}</a>;
});

const mockProjects = [
    { id: 'proj-1', name: 'SaaS App', description: 'A great SaaS product.', type: 'software', status: 'active', platform: 'github' },
    { id: 'yt-1', name: 'Main YouTube', type: 'content', status: 'active', platform: 'youtube' },
];

const mockProjectDetails = {
    id: 'proj-1',
    name: 'SaaS App',
    description: 'A great SaaS product.',
    type: 'software',
    status: 'active',
    platform: 'github',
    link: 'https://github.com/test/saas',
    totalRevenue: 68000,
    totalCosts: 12000,
    netProfit: 56000,
    metrics: [
        { name: 'MRR', value: 8500 },
        { name: 'Active Users', value: 340 },
    ],
};

const mockActivity = [
    {
        id: 'a-1',
        type: 'commit',
        timestamp: '2025-01-16T08:42:00Z',
        projectId: 'proj-1',
        projectName: 'SaaS App',
        externalId: 'commit:abc',
        payload: { sha: 'abc1234', message: 'feat: add feature', author: 'dev', htmlUrl: 'https://github.com/commit/abc', repo: 'test/saas' },
    },
    {
        id: 'a-2',
        type: 'tweet',
        timestamp: '2025-01-16T09:00:00Z',
        externalId: 'tweet:100',
        payload: { text: 'Shipped it!', likeCount: 10, retweetCount: 2, replyCount: 1 },
    },
];

const mockStreams = [
    {
        id: 'stream-1',
        name: 'Building Auth Live',
        videoId: 'vid1',
        actualStartTime: '2025-01-15T14:00:00Z',
        actualEndTime: '2025-01-15T17:00:00Z',
        thumbnailUrl: 'https://thumb.jpg',
        viewCount: 1000,
        likeCount: 50,
        commentCount: 10,
        duration: 'PT3H',
        commitCount: 3,
        projectIds: ['proj-1'],
    },
    {
        id: 'stream-2',
        name: 'Unrelated Stream',
        videoId: 'vid2',
        actualStartTime: '2025-01-10T18:00:00Z',
        actualEndTime: '2025-01-10T20:00:00Z',
        thumbnailUrl: '',
        viewCount: 500,
        likeCount: 30,
        commentCount: 5,
        duration: 'PT2H',
        commitCount: 0,
        projectIds: ['yt-1'],
    },
];

describe('Project Detail Page', () => {
    it('renders project name, description, financials, and metrics', async () => {
        const mockClient = {
            getProjectDetails: jest.fn().mockResolvedValue(mockProjectDetails),
            getRecentActivity: jest.fn().mockResolvedValue(mockActivity),
            getStreams: jest.fn().mockResolvedValue(mockStreams),
            getAllProjects: jest.fn().mockResolvedValue(mockProjects),
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);

        const page = await ProjectDetailPage({ params: Promise.resolve({ id: 'proj-1' }) });
        render(page);

        // Name appears in h1 and ProjectTag — use heading role
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('SaaS App');
        expect(screen.getByText('A great SaaS product.')).toBeInTheDocument();
        expect(screen.getByText('$68,000')).toBeInTheDocument();
        expect(screen.getByText('$12,000')).toBeInTheDocument();
        expect(screen.getByText('$56,000')).toBeInTheDocument();
        expect(screen.getByText('Metrics')).toBeInTheDocument();
        expect(screen.getByText('MRR')).toBeInTheDocument();
        expect(screen.getByText('8,500')).toBeInTheDocument();
        expect(screen.getByText('Active Users')).toBeInTheDocument();
    });

    it('calls notFound when project does not exist', async () => {
        const mockClient = {
            getProjectDetails: jest.fn().mockResolvedValue(null),
            getRecentActivity: jest.fn().mockResolvedValue([]),
            getStreams: jest.fn().mockResolvedValue([]),
            getAllProjects: jest.fn().mockResolvedValue([]),
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);

        await expect(
            ProjectDetailPage({ params: Promise.resolve({ id: 'nonexistent' }) }),
        ).rejects.toThrow('NOT_FOUND');
    });

    it('filters activity to only show events for this project', async () => {
        const mockClient = {
            getProjectDetails: jest.fn().mockResolvedValue(mockProjectDetails),
            getRecentActivity: jest.fn().mockResolvedValue(mockActivity),
            getStreams: jest.fn().mockResolvedValue([]),
            getAllProjects: jest.fn().mockResolvedValue(mockProjects),
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);

        const page = await ProjectDetailPage({ params: Promise.resolve({ id: 'proj-1' }) });
        render(page);

        // Commit for proj-1 should be visible
        expect(screen.getByText('feat: add feature')).toBeInTheDocument();
        // Tweet has no projectId, so it should NOT appear
        expect(screen.queryByText('Shipped it!')).not.toBeInTheDocument();
    });

    it('shows related streams that include this project', async () => {
        const mockClient = {
            getProjectDetails: jest.fn().mockResolvedValue(mockProjectDetails),
            getRecentActivity: jest.fn().mockResolvedValue([]),
            getStreams: jest.fn().mockResolvedValue(mockStreams),
            getAllProjects: jest.fn().mockResolvedValue(mockProjects),
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);

        const page = await ProjectDetailPage({ params: Promise.resolve({ id: 'proj-1' }) });
        render(page);

        expect(screen.getByText('Related Streams')).toBeInTheDocument();
        expect(screen.getByText('Building Auth Live')).toBeInTheDocument();
        // Unrelated stream should not appear
        expect(screen.queryByText('Unrelated Stream')).not.toBeInTheDocument();
    });
});
