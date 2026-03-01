import { render, screen, fireEvent } from '@testing-library/react';
import { StreamsFilteredList } from '../streams-filtered-list';
import { StreamSummary, Project } from '@/lib/data-client';
import React from 'react';

jest.mock('next/link', () => {
    return ({ children, href }: any) => <a href={href}>{children}</a>;
});

const mockProjects: Record<string, Project> = {
    'proj-yt': { id: 'proj-yt', name: 'Main YouTube', type: 'content', status: 'active', platform: 'youtube' },
    'proj-gh': { id: 'proj-gh', name: 'SaaS App', type: 'software', status: 'active', platform: 'github' },
};

const mockStreams: StreamSummary[] = [
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
        projectIds: ['proj-yt', 'proj-gh'],
    },
    {
        id: 'stream-2',
        name: 'CI/CD Setup',
        videoId: 'vid2',
        actualStartTime: '2025-01-10T18:00:00Z',
        actualEndTime: '2025-01-10T20:00:00Z',
        thumbnailUrl: '',
        viewCount: 500,
        likeCount: 30,
        commentCount: 5,
        duration: 'PT2H',
        commitCount: 0,
        projectIds: ['proj-gh'],
    },
    {
        id: 'stream-3',
        name: 'YouTube Analytics',
        videoId: 'vid3',
        actualStartTime: '2025-01-05T12:00:00Z',
        actualEndTime: '2025-01-05T14:00:00Z',
        thumbnailUrl: '',
        viewCount: 200,
        likeCount: 10,
        commentCount: 2,
        duration: 'PT2H',
        commitCount: 1,
        projectIds: ['proj-yt'],
    },
];

describe('StreamsFilteredList', () => {
    it('renders all streams by default', () => {
        render(<StreamsFilteredList streams={mockStreams} projectMap={mockProjects} />);
        expect(screen.getByText('Building Auth Live')).toBeInTheDocument();
        expect(screen.getByText('CI/CD Setup')).toBeInTheDocument();
        expect(screen.getByText('YouTube Analytics')).toBeInTheDocument();
    });

    it('renders filter chips for each unique project', () => {
        render(<StreamsFilteredList streams={mockStreams} projectMap={mockProjects} />);
        expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
        const filterGroup = screen.getByRole('group', { name: 'Filter by project' });
        expect(filterGroup).toBeInTheDocument();
    });

    it('filters streams when a project chip is clicked', () => {
        render(<StreamsFilteredList streams={mockStreams} projectMap={mockProjects} />);

        // Click "SaaS App" filter — streams 1 and 2 have proj-gh
        const filterGroup = screen.getByRole('group', { name: 'Filter by project' });
        const buttons = filterGroup.querySelectorAll('button');
        // buttons: [All, Main YouTube, SaaS App]
        fireEvent.click(buttons[2]);

        expect(screen.getByText('Building Auth Live')).toBeInTheDocument();
        expect(screen.getByText('CI/CD Setup')).toBeInTheDocument();
        expect(screen.queryByText('YouTube Analytics')).not.toBeInTheDocument();
    });

    it('resets filter when All chip is clicked', () => {
        render(<StreamsFilteredList streams={mockStreams} projectMap={mockProjects} />);

        // First filter to a project
        const filterGroup = screen.getByRole('group', { name: 'Filter by project' });
        const buttons = filterGroup.querySelectorAll('button');
        fireEvent.click(buttons[2]); // SaaS App
        expect(screen.queryByText('YouTube Analytics')).not.toBeInTheDocument();

        // Click "All" to reset
        fireEvent.click(screen.getByRole('button', { name: 'All' }));
        expect(screen.getByText('YouTube Analytics')).toBeInTheDocument();
        expect(screen.getByText('Building Auth Live')).toBeInTheDocument();
        expect(screen.getByText('CI/CD Setup')).toBeInTheDocument();
    });

    it('shows empty message when no streams exist', () => {
        render(<StreamsFilteredList streams={[]} projectMap={mockProjects} />);
        expect(screen.getByText('No streams yet.')).toBeInTheDocument();
    });

    it('does not render filter chips when no projects appear in streams', () => {
        const streamsNoProjects: StreamSummary[] = [{
            ...mockStreams[0],
            projectIds: [],
        }];
        render(<StreamsFilteredList streams={streamsNoProjects} projectMap={mockProjects} />);
        expect(screen.queryByRole('group', { name: 'Filter by project' })).not.toBeInTheDocument();
    });
});
