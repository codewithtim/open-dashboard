import { GET } from '../route';
import { getDataClient } from '@/lib/client-factory';
import { getMetricsProvider } from '@/lib/providers';
import { YouTubeStreamsProvider } from '@/lib/providers/youtube-streams-provider';
import { GitHubCommitsProvider } from '@/lib/providers/github-commits-provider';

// Mock the Drizzle DB module
const mockInsertValues = jest.fn().mockReturnValue({
    onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
    onConflictDoNothing: jest.fn().mockResolvedValue(undefined),
});
const mockInsert = jest.fn().mockReturnValue({
    values: mockInsertValues,
});
const mockSelect = jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
            groupBy: jest.fn().mockResolvedValue([]),
        }),
        orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
        }),
    }),
});
const mockUpdate = jest.fn().mockReturnValue({
    set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
    }),
});
const mockDelete = jest.fn().mockReturnValue({
    where: jest.fn().mockResolvedValue(undefined),
});

jest.mock('@/lib/db', () => ({
    getDb: jest.fn(() => ({
        insert: mockInsert,
        select: mockSelect,
        update: mockUpdate,
        delete: mockDelete,
    })),
}));

jest.mock('@/lib/client-factory', () => ({
    getDataClient: jest.fn(),
}));

jest.mock('@/lib/providers', () => ({
    getMetricsProvider: jest.fn(),
}));

jest.mock('@/lib/providers/youtube-streams-provider');
jest.mock('@/lib/providers/github-commits-provider');

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

jest.mock('next/server', () => {
    class MockNextResponse {
        status: number;
        body: string;
        constructor(body: string, init?: any) {
            this.body = body;
            this.status = init?.status || 200;
        }
        static json(body: any, init?: any) {
            return { status: init?.status || 200, json: async () => body };
        }
        async text() { return this.body; }
    }

    return {
        NextResponse: MockNextResponse,
        NextRequest: jest.fn(),
    };
});

const authReq = {
    headers: { get: (name: string) => name === 'authorization' ? 'Bearer test_secret' : null }
};

describe('Cron API Route GET', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv, CRON_SECRET: 'test_secret' };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('processes metrics for projects and upserts to Turso', async () => {
        const mockClient = {
            getProjects: jest.fn().mockResolvedValue([
                { id: 'yt-123', name: 'My Channel', platform: 'youtube', platformAccountId: 'yt-account' },
                { id: 'no-id-456', name: 'No Platform Account ID', platform: 'youtube' },
                { id: 'other-1', name: 'SaaS App', platform: 'unknown' },
            ]),
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);

        const mockYouTubeProvider = {
            getMetrics: jest.fn().mockResolvedValue({
                subscribers: 10000,
                views: 500000,
            }),
        };
        (getMetricsProvider as jest.Mock).mockImplementation((platform) => {
            if (platform === 'youtube') return mockYouTubeProvider;
            throw new Error('Not implemented');
        });

        (YouTubeStreamsProvider as jest.Mock).mockImplementation(() => ({
            getStreams: jest.fn().mockResolvedValue([]),
        }));

        const response = await GET(authReq as any);
        expect(response.status).toBe(200);

        expect(getMetricsProvider).toHaveBeenCalledWith('youtube');
        expect(mockYouTubeProvider.getMetrics).toHaveBeenCalledWith('yt-account');

        // Verify metrics were inserted via Drizzle
        expect(mockInsert).toHaveBeenCalled();
        expect(mockInsertValues).toHaveBeenCalled();
    });

    it('handles agent commit processing gracefully when no agents configured', async () => {
        const mockClient = {
            getProjects: jest.fn().mockResolvedValue([]),
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);
        (getMetricsProvider as jest.Mock).mockImplementation(() => { throw new Error('Not implemented'); });

        // processAgentCommits will fail since the mock DB doesn't return arrays,
        // but the try/catch in GET should handle it gracefully
        const response = await GET(authReq as any);
        expect(response.status).toBe(200);
    });

    it('discovers YouTube streams and correlates GitHub commits', async () => {
        const mockClient = {
            getProjects: jest.fn().mockResolvedValue([
                { id: 'yt-1', name: 'YouTube Channel', platform: 'youtube', platformAccountId: 'UC123' },
                { id: 'gh-1', name: 'My Repo', platform: 'github', platformAccountId: 'owner/repo' },
            ]),
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);
        (getMetricsProvider as jest.Mock).mockImplementation(() => { throw new Error('Not implemented'); });

        const mockGetCompletedStreams = jest.fn().mockResolvedValue([
            {
                videoId: 'vid1',
                title: 'Live Stream',
                actualStartTime: '2025-01-15T14:00:00Z',
                actualEndTime: '2025-01-15T17:00:00Z',
                thumbnailUrl: 'https://thumb.jpg',
                viewCount: 1000,
                likeCount: 50,
                commentCount: 10,
                duration: 'PT3H',
            },
        ]);
        (YouTubeStreamsProvider as jest.Mock).mockImplementation(() => ({
            getStreams: mockGetCompletedStreams,
        }));

        const mockGetCommitsInWindow = jest.fn().mockResolvedValue([
            {
                sha: 'abc123',
                message: 'feat: add feature',
                author: 'timknight',
                timestamp: '2025-01-15T15:00:00Z',
                htmlUrl: 'https://github.com/owner/repo/commit/abc123',
            },
        ]);
        (GitHubCommitsProvider as jest.Mock).mockImplementation(() => ({
            getCommitsInWindow: mockGetCommitsInWindow,
        }));

        const response = await GET(authReq as any);
        expect(response.status).toBe(200);

        expect(mockGetCompletedStreams).toHaveBeenCalledWith('UC123', undefined);

        expect(mockGetCommitsInWindow).toHaveBeenCalledWith(
            'owner/repo',
            '2025-01-15T14:00:00Z',
            '2025-01-15T17:00:00Z',
        );

        // Verify stream was inserted via Drizzle
        expect(mockInsert).toHaveBeenCalled();
    });
});
