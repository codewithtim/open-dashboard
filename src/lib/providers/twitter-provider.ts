export interface TweetData {
    tweetId: string;
    text: string;
    createdAt: string;
    likeCount: number;
    retweetCount: number;
    replyCount: number;
}

export class TwitterProvider {
    private bearerToken: string;

    constructor() {
        const token = process.env.TWITTER_BEARER_TOKEN;
        if (!token) {
            throw new Error('TWITTER_BEARER_TOKEN is not set');
        }
        this.bearerToken = token;
    }

    async getRecentTweets(userId: string, since?: string): Promise<TweetData[]> {
        const params = new URLSearchParams({
            'tweet.fields': 'created_at,public_metrics',
            'max_results': '100',
        });
        if (since) {
            params.set('start_time', since);
        }

        const url = `https://api.twitter.com/2/users/${userId}/tweets?${params}`;
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${this.bearerToken}`,
            },
        });

        if (!res.ok) {
            throw new Error(`Twitter API returned ${res.status}`);
        }

        const json = await res.json();
        const data = json.data || [];

        return data.map((tweet: any) => ({
            tweetId: tweet.id,
            text: tweet.text || '',
            createdAt: tweet.created_at || '',
            likeCount: tweet.public_metrics?.like_count || 0,
            retweetCount: tweet.public_metrics?.retweet_count || 0,
            replyCount: tweet.public_metrics?.reply_count || 0,
        }));
    }
}
