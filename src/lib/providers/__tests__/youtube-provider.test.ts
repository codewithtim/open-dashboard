import { YouTubeMetricsProvider } from '../youtube-provider';

describe('YouTubeMetricsProvider', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv, YOUTUBE_API_KEY: 'test-api-key' };

        // Mock global fetch
        global.fetch = jest.fn();
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should implement the MetricsProvider interface', () => {
        const provider = new YouTubeMetricsProvider();
        expect(provider.platformName).toBe('youtube');
        expect(typeof provider.getMetrics).toBe('function');
    });

    it('should throw an error if YOUTUBE_API_KEY is missing', async () => {
        delete process.env.YOUTUBE_API_KEY;
        const provider = new YouTubeMetricsProvider();
        await expect(provider.getMetrics('UC123')).rejects.toThrow('YOUTUBE_API_KEY is not configured');
    });

    it('should fetch channel statistics and normalize them to SocialMetrics', async () => {
        // Setup mock response from YouTube API
        const mockYouTubeResponse = {
            items: [
                {
                    statistics: {
                        subscriberCount: '15000',
                        viewCount: '2500000',
                        videoCount: '150'
                    }
                }
            ]
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => mockYouTubeResponse
        });

        const provider = new YouTubeMetricsProvider();
        const metrics = await provider.getMetrics('UC123');

        // Assert fetch was called correctly
        expect(fetch).toHaveBeenCalledWith(
            'https://www.googleapis.com/youtube/v3/channels?part=statistics&id=UC123&key=test-api-key'
        );

        // Assert normalization to SocialMetrics domain model
        expect(metrics).toEqual({
            subscribers: 15000,
            views: 2500000,
            videos: 150
        });
    });

    it('should throw an error if the YouTube API returns an error or no items', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ items: [] }) // Empty items array
        });

        const provider = new YouTubeMetricsProvider();
        await expect(provider.getMetrics('invalid-channel-id')).rejects.toThrow('YouTube channel not found');
    });
});
