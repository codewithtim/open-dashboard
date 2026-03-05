import { TwitterProvider } from '../twitter-provider';

describe('TwitterProvider', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv, TWITTER_BEARER_TOKEN: 'test-token' };
        global.fetch = jest.fn();
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('throws if TWITTER_BEARER_TOKEN is not set', () => {
        delete process.env.TWITTER_BEARER_TOKEN;
        expect(() => new TwitterProvider()).toThrow('TWITTER_BEARER_TOKEN is not set');
    });

    it('fetches recent tweets for a user', async () => {
        const mockResponse = {
            data: [
                {
                    id: '123456',
                    text: 'Hello world',
                    created_at: '2025-01-15T12:00:00Z',
                    public_metrics: {
                        like_count: 10,
                        retweet_count: 5,
                        reply_count: 2,
                    },
                },
            ],
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => mockResponse,
        });

        const provider = new TwitterProvider();
        const tweets = await provider.getRecentTweets('user123');

        expect(tweets).toHaveLength(1);
        expect(tweets[0]).toEqual({
            tweetId: '123456',
            text: 'Hello world',
            createdAt: '2025-01-15T12:00:00Z',
            likeCount: 10,
            retweetCount: 5,
            replyCount: 2,
        });

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('https://api.twitter.com/2/users/user123/tweets'),
            { headers: { 'Authorization': 'Bearer test-token' } },
        );
    });

    it('passes start_time when since is provided', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ data: [] }),
        });

        const provider = new TwitterProvider();
        await provider.getRecentTweets('user123', '2025-01-14T00:00:00Z');

        const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
        expect(calledUrl).toContain('start_time=2025-01-14T00%3A00%3A00Z');
    });

    it('returns empty array when no tweets', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({}),
        });

        const provider = new TwitterProvider();
        const tweets = await provider.getRecentTweets('user123');

        expect(tweets).toHaveLength(0);
    });

    it('throws on API error', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 403,
        });

        const provider = new TwitterProvider();
        await expect(provider.getRecentTweets('user123')).rejects.toThrow('Twitter API returned 403');
    });
});
