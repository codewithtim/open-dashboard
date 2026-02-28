import { render, screen } from '@testing-library/react';
import StreamsPage from '../page';
import { getDataClient } from '@/lib/client-factory';
import React from 'react';

jest.mock('@/lib/client-factory', () => ({
    getDataClient: jest.fn(),
}));

jest.mock('next/link', () => {
    return ({ children, href }: any) => <a href={href}>{children}</a>;
});

describe('Streams Page', () => {
    it('renders stream cards when streams exist', async () => {
        const mockClient = {
            getStreams: jest.fn().mockResolvedValue([
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
                    projectIds: ['yt-1'],
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
                    projectIds: ['yt-1'],
                },
            ]),
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);

        const page = await StreamsPage();
        render(page);

        expect(screen.getByText('Streams')).toBeInTheDocument();
        expect(screen.getByText('Building Auth Live')).toBeInTheDocument();
        expect(screen.getByText('CI/CD Setup')).toBeInTheDocument();
    });

    it('shows empty message when no streams exist', async () => {
        const mockClient = {
            getStreams: jest.fn().mockResolvedValue([]),
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);

        const page = await StreamsPage();
        render(page);

        expect(screen.getByText('No streams yet.')).toBeInTheDocument();
    });
});
