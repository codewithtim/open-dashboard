import { render, screen } from '@testing-library/react';
import StreamDetailPage from '../page';
import { getDataClient } from '@/lib/client-factory';
import React from 'react';

jest.mock('@/lib/client-factory', () => ({
    getDataClient: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    notFound: jest.fn(() => { throw new Error('NOT_FOUND'); }),
}));

const mockProjects = [
    { id: 'yt-1', name: 'Main YouTube', type: 'content', status: 'active', platform: 'youtube' },
    { id: 'proj-1', name: 'SaaS App', type: 'software', status: 'active', platform: 'github' },
];

const mockStream = {
    id: 'stream-1',
    name: 'Building Auth from Scratch',
    videoId: 'abc123',
    actualStartTime: '2025-01-15T14:00:00Z',
    actualEndTime: '2025-01-15T17:00:00Z',
    thumbnailUrl: 'https://thumb.jpg',
    viewCount: 1250,
    likeCount: 89,
    commentCount: 34,
    duration: 'PT3H0M0S',
    projectIds: ['yt-1'],
    commits: [
        {
            sha: 'abc1234567890',
            message: 'feat: add auth',
            author: 'timknight',
            timestamp: '2025-01-15T14:30:00Z',
            htmlUrl: 'https://github.com/owner/repo/commit/abc1234567890',
            repo: 'owner/repo',
            projectId: 'proj-1',
        },
        {
            sha: 'def5678901234',
            message: 'fix: login bug',
            author: 'timknight',
            timestamp: '2025-01-15T15:00:00Z',
            htmlUrl: 'https://github.com/owner/repo/commit/def5678901234',
            repo: 'owner/repo',
            projectId: 'proj-1',
        },
    ],
};

describe('Stream Detail Page', () => {
    it('renders stream details with embed, stats, commits, and project tags', async () => {
        const mockClient = {
            getStreamById: jest.fn().mockResolvedValue(mockStream),
            getProjects: jest.fn().mockResolvedValue(mockProjects),
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);

        const page = await StreamDetailPage({ params: Promise.resolve({ id: 'stream-1' }) });
        render(page);

        expect(screen.getByText('Building Auth from Scratch')).toBeInTheDocument();
        expect(screen.getByText('Commits During Stream')).toBeInTheDocument();
        expect(screen.getByText('owner/repo')).toBeInTheDocument();
        expect(screen.getByText('feat: add auth')).toBeInTheDocument();
        expect(screen.getByText('fix: login bug')).toBeInTheDocument();

        // Project tags should render (yt-1 from projectIds + proj-1 from commits)
        expect(screen.getByText('Main YouTube')).toBeInTheDocument();
        expect(screen.getByText('SaaS App')).toBeInTheDocument();

        // Check YouTube embed iframe
        const iframe = document.querySelector('iframe');
        expect(iframe).toBeTruthy();
        expect(iframe!.getAttribute('src')).toBe('https://www.youtube.com/embed/abc123');
    });

    it('calls notFound when stream does not exist', async () => {
        const mockClient = {
            getStreamById: jest.fn().mockResolvedValue(null),
            getProjects: jest.fn().mockResolvedValue([]),
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);

        await expect(
            StreamDetailPage({ params: Promise.resolve({ id: 'nonexistent' }) }),
        ).rejects.toThrow('NOT_FOUND');
    });

    it('does not render commits section when stream has no commits', async () => {
        const noCommitsStream = { ...mockStream, commits: [] };
        const mockClient = {
            getStreamById: jest.fn().mockResolvedValue(noCommitsStream),
            getProjects: jest.fn().mockResolvedValue(mockProjects),
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);

        const page = await StreamDetailPage({ params: Promise.resolve({ id: 'stream-1' }) });
        render(page);

        expect(screen.getByText('Building Auth from Scratch')).toBeInTheDocument();
        expect(screen.queryByText('Commits During Stream')).not.toBeInTheDocument();
    });
});
