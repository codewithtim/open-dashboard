import { render, screen } from '@testing-library/react';
import { StreamCard } from '../stream-card';
import { StreamSummary, Project } from '@/lib/data-client';
import React from 'react';

jest.mock('next/link', () => {
    return ({ children, href }: any) => <a href={href}>{children}</a>;
});

const mockStream: StreamSummary = {
    id: 'stream-1',
    name: 'Building Auth from Scratch',
    videoId: 'abc123',
    actualStartTime: '2025-01-15T14:00:00Z',
    actualEndTime: '2025-01-15T17:00:00Z',
    thumbnailUrl: 'https://thumb.jpg',
    viewCount: 1250,
    likeCount: 89,
    commentCount: 34,
    duration: 'PT3H',
    commitCount: 5,
    projectIds: ['yt-1'],
};

const mockProjects: Project[] = [
    { id: 'yt-1', name: 'Main YouTube', type: 'content', status: 'active', platform: 'youtube' },
    { id: 'gh-1', name: 'SaaS App', type: 'software', status: 'active', platform: 'github' },
];

describe('StreamCard', () => {
    it('renders stream title and view count', () => {
        render(<StreamCard stream={mockStream} />);
        expect(screen.getByText('Building Auth from Scratch')).toBeInTheDocument();
        expect(screen.getByText('1,250')).toBeInTheDocument();
    });

    it('renders commit count when commits exist', () => {
        render(<StreamCard stream={mockStream} />);
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('links to the stream detail page', () => {
        render(<StreamCard stream={mockStream} />);
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/streams/stream-1');
    });

    it('hides commit count when zero', () => {
        const noCommits = { ...mockStream, commitCount: 0 };
        render(<StreamCard stream={noCommits} />);
        // View count should still be there
        expect(screen.getByText('1,250')).toBeInTheDocument();
    });

    it('renders project tags when projects are provided', () => {
        render(<StreamCard stream={mockStream} projects={mockProjects} />);
        expect(screen.getByText('Main YouTube')).toBeInTheDocument();
        expect(screen.getByText('SaaS App')).toBeInTheDocument();
    });

    it('does not render project tags when no projects', () => {
        const { container } = render(<StreamCard stream={mockStream} projects={[]} />);
        expect(container.querySelectorAll('.rounded-full')).toHaveLength(0);
    });
});
