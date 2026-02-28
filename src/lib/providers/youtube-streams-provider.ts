export interface YouTubeStreamData {
    videoId: string;
    title: string;
    actualStartTime: string;
    actualEndTime: string;
    thumbnailUrl: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    duration: string;
}

export class YouTubeStreamsProvider {
    private apiKey: string;

    constructor() {
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) {
            throw new Error('YOUTUBE_API_KEY is not configured');
        }
        this.apiKey = apiKey;
    }

    async getCompletedStreams(channelId: string, since?: string): Promise<YouTubeStreamData[]> {
        const uploadsPlaylistId = await this.getUploadsPlaylistId(channelId);
        const videoIds = await this.getPlaylistVideoIds(uploadsPlaylistId, since);
        if (videoIds.length === 0) return [];
        return this.getStreamDetails(videoIds);
    }

    private async getUploadsPlaylistId(channelId: string): Promise<string> {
        const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${this.apiKey}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`YouTube API returned ${res.status}`);
        const data = await res.json();
        if (!data.items || data.items.length === 0) {
            throw new Error('YouTube channel not found');
        }
        return data.items[0].contentDetails.relatedPlaylists.uploads;
    }

    private async getPlaylistVideoIds(playlistId: string, since?: string): Promise<string[]> {
        const videoIds: string[] = [];
        let pageToken: string | undefined;

        do {
            const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
            url.searchParams.set('part', 'snippet');
            url.searchParams.set('playlistId', playlistId);
            url.searchParams.set('maxResults', '50');
            url.searchParams.set('key', this.apiKey);
            if (pageToken) url.searchParams.set('pageToken', pageToken);

            const res = await fetch(url.toString());
            if (!res.ok) throw new Error(`YouTube API returned ${res.status}`);
            const data = await res.json();

            let hitSince = false;
            for (const item of data.items || []) {
                const publishedAt = item.snippet?.publishedAt;
                if (since && publishedAt && publishedAt < since) {
                    hitSince = true;
                    break;
                }
                const videoId = item.snippet?.resourceId?.videoId;
                if (videoId) videoIds.push(videoId);
            }

            if (hitSince) break;
            pageToken = data.nextPageToken;
        } while (pageToken);

        return videoIds;
    }

    private async getStreamDetails(videoIds: string[]): Promise<YouTubeStreamData[]> {
        const streams: YouTubeStreamData[] = [];

        // Batch in groups of 50 (YouTube API limit)
        for (let i = 0; i < videoIds.length; i += 50) {
            const batch = videoIds.slice(i, i + 50);
            const url = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails,snippet,statistics,contentDetails&id=${batch.join(',')}&key=${this.apiKey}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error(`YouTube API returned ${res.status}`);
            const data = await res.json();

            for (const item of data.items || []) {
                const lsd = item.liveStreamingDetails;
                if (!lsd?.actualStartTime || !lsd?.actualEndTime) continue;

                streams.push({
                    videoId: item.id,
                    title: item.snippet?.title || '',
                    actualStartTime: lsd.actualStartTime,
                    actualEndTime: lsd.actualEndTime,
                    thumbnailUrl: item.snippet?.thumbnails?.maxres?.url
                        || item.snippet?.thumbnails?.high?.url
                        || '',
                    viewCount: parseInt(item.statistics?.viewCount || '0', 10),
                    likeCount: parseInt(item.statistics?.likeCount || '0', 10),
                    commentCount: parseInt(item.statistics?.commentCount || '0', 10),
                    duration: item.contentDetails?.duration || '',
                });
            }
        }

        return streams;
    }
}
