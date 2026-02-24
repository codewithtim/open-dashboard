import { SocialMetrics, MetricsProvider } from './types';

export class YouTubeMetricsProvider implements MetricsProvider {
    readonly platformName = 'youtube';

    async getMetrics(platformAccountId: string): Promise<SocialMetrics> {
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) {
            throw new Error('YOUTUBE_API_KEY is not configured');
        }

        const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${platformAccountId}&key=${apiKey}`;
        const res = await fetch(url);

        if (!res.ok) {
            throw new Error(`YouTube API returned ${res.status}`);
        }

        const data = await res.json();
        if (!data.items || data.items.length === 0) {
            throw new Error('YouTube channel not found');
        }

        const stats = data.items[0].statistics;

        // Parse and normalize into Domain Model
        return {
            subscribers: parseInt(stats.subscriberCount, 10),
            views: parseInt(stats.viewCount, 10),
            videos: parseInt(stats.videoCount, 10)
        };
    }
}
