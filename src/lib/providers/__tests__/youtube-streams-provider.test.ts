import { YouTubeStreamsProvider } from '../youtube-streams-provider';

describe('YouTubeStreamsProvider', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv, YOUTUBE_API_KEY: 'test-api-key' };
        global.fetch = jest.fn();
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('throws if YOUTUBE_API_KEY is missing', () => {
        delete process.env.YOUTUBE_API_KEY;
        expect(() => new YouTubeStreamsProvider()).toThrow('YOUTUBE_API_KEY is not configured');
    });

    it('fetches completed streams for a channel', async () => {
        // 1. channels.list → uploads playlist
        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    items: [{ contentDetails: { relatedPlaylists: { uploads: 'UU123' } } }],
                }),
            })
            // 2. playlistItems.list → video IDs (single page)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    items: [
                        { snippet: { resourceId: { videoId: 'vid1' }, publishedAt: '2025-01-15T00:00:00Z' } },
                        { snippet: { resourceId: { videoId: 'vid2' }, publishedAt: '2025-01-10T00:00:00Z' } },
                    ],
                }),
            })
            // 3. videos.list → full details, only vid1 is a completed stream
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    items: [
                        {
                            id: 'vid1',
                            snippet: {
                                title: 'Live Stream 1',
                                thumbnails: { maxres: { url: 'https://thumb.jpg' } },
                            },
                            liveStreamingDetails: {
                                actualStartTime: '2025-01-15T14:00:00Z',
                                actualEndTime: '2025-01-15T17:00:00Z',
                            },
                            statistics: { viewCount: '1000', likeCount: '50', commentCount: '10' },
                            contentDetails: { duration: 'PT3H' },
                        },
                        {
                            id: 'vid2',
                            snippet: { title: 'Regular Video' },
                            statistics: { viewCount: '500' },
                            contentDetails: { duration: 'PT10M' },
                            // No liveStreamingDetails → not a stream
                        },
                    ],
                }),
            });

        const provider = new YouTubeStreamsProvider();
        const streams = await provider.getCompletedStreams('UC123');

        expect(streams).toHaveLength(1);
        expect(streams[0]).toEqual({
            videoId: 'vid1',
            title: 'Live Stream 1',
            actualStartTime: '2025-01-15T14:00:00Z',
            actualEndTime: '2025-01-15T17:00:00Z',
            thumbnailUrl: 'https://thumb.jpg',
            viewCount: 1000,
            likeCount: 50,
            commentCount: 10,
            duration: 'PT3H',
        });
    });

    it('paginates playlist items and stops at since cutoff', async () => {
        (global.fetch as jest.Mock)
            // channels.list
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    items: [{ contentDetails: { relatedPlaylists: { uploads: 'UU123' } } }],
                }),
            })
            // playlistItems page 1 (has nextPageToken)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    items: [
                        { snippet: { resourceId: { videoId: 'new1' }, publishedAt: '2025-02-01T00:00:00Z' } },
                    ],
                    nextPageToken: 'page2token',
                }),
            })
            // playlistItems page 2 (hits since cutoff)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    items: [
                        { snippet: { resourceId: { videoId: 'old1' }, publishedAt: '2024-12-01T00:00:00Z' } },
                    ],
                }),
            })
            // videos.list for new1 only (old1 was before since cutoff)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ items: [] }),
            });

        const provider = new YouTubeStreamsProvider();
        const streams = await provider.getCompletedStreams('UC123', '2025-01-01T00:00:00Z');

        // Should only fetch video details for new1
        expect(streams).toHaveLength(0); // No completed streams in the batch
        expect(global.fetch).toHaveBeenCalledTimes(4);
    });

    it('returns empty array when no videos found', async () => {
        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    items: [{ contentDetails: { relatedPlaylists: { uploads: 'UU123' } } }],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ items: [] }),
            });

        const provider = new YouTubeStreamsProvider();
        const streams = await provider.getCompletedStreams('UC123');

        expect(streams).toHaveLength(0);
    });

    it('batches video IDs in groups of 50', async () => {
        // Generate 75 video IDs
        const videoItems = Array.from({ length: 75 }, (_, i) => ({
            snippet: { resourceId: { videoId: `vid${i}` }, publishedAt: '2025-01-15T00:00:00Z' },
        }));

        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    items: [{ contentDetails: { relatedPlaylists: { uploads: 'UU123' } } }],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ items: videoItems }),
            })
            // Batch 1 (50 videos)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ items: [] }),
            })
            // Batch 2 (25 videos)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ items: [] }),
            });

        const provider = new YouTubeStreamsProvider();
        await provider.getCompletedStreams('UC123');

        // channels + playlistItems + 2 video batches = 4 calls
        expect(global.fetch).toHaveBeenCalledTimes(4);
    });
});
