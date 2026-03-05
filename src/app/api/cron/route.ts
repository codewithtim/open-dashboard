import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { notion } from '@/lib/notion-client';
import { getDataClient } from '@/lib/client-factory';
import { getMetricsProvider } from '@/lib/providers';
import { YouTubeStreamsProvider } from '@/lib/providers/youtube-streams-provider';
import { GitHubCommitsProvider } from '@/lib/providers/github-commits-provider';
import { TwitterProvider } from '@/lib/providers/twitter-provider';
import { StreamCommit } from '@/lib/data-client';
import { Project } from '@/lib/data-client';

function chunkRichText(text: string): Array<{ text: { content: string } }> {
    const chunks: Array<{ text: { content: string } }> = [];
    for (let i = 0; i < text.length; i += 2000) {
        chunks.push({ text: { content: text.slice(i, i + 2000) } });
    }
    return chunks;
}

async function processStreams(projects: Project[]) {
    const streamsDbId = process.env.NOTION_STREAMS_DB_ID;
    if (!streamsDbId) return;

    const youtubeProjects = projects.filter(p => p.platform === 'youtube' && p.platformAccountId);
    const githubProjects = projects.filter(p => p.platform === 'github' && p.platformAccountId);

    if (youtubeProjects.length === 0) return;

    // Find the most recent stream end time for incremental fetching
    let since: string | undefined;
    try {
        const existingStreams = await notion.databases.query({
            database_id: streamsDbId,
            sorts: [{ property: 'actualEndTime', direction: 'descending' }],
            page_size: 1,
        });
        if (existingStreams.results.length > 0) {
            const page = existingStreams.results[0] as any;
            since = page.properties?.actualEndTime?.date?.start;
        }
    } catch {
        // If query fails, do a full fetch
    }

    let streamsProvider: YouTubeStreamsProvider;
    try {
        streamsProvider = new YouTubeStreamsProvider();
    } catch (err) {
        console.error('Skipping streams processing:', err);
        return;
    }
    const commitsProvider = new GitHubCommitsProvider();

    for (const ytProject of youtubeProjects) {
        try {
            const ytStreams = await streamsProvider.getCompletedStreams(ytProject.platformAccountId!, since);

            for (const stream of ytStreams) {
                // Fetch commits from all GitHub repos within the stream window
                const allCommits: StreamCommit[] = [];
                for (const ghProject of githubProjects) {
                    try {
                        const ghCommits = await commitsProvider.getCommitsInWindow(
                            ghProject.platformAccountId!,
                            stream.actualStartTime,
                            stream.actualEndTime,
                        );
                        for (const c of ghCommits) {
                            allCommits.push({
                                sha: c.sha,
                                message: c.message,
                                author: c.author,
                                timestamp: c.timestamp,
                                htmlUrl: c.htmlUrl,
                                repo: ghProject.platformAccountId!,
                                projectId: ghProject.id,
                            });
                        }
                    } catch (err) {
                        console.error(`Failed to fetch commits for ${ghProject.platformAccountId}:`, err);
                    }
                }

                const commitsJson = JSON.stringify(allCommits);
                const richTextChunks = chunkRichText(commitsJson);

                // Upsert by videoId
                const existing = await notion.databases.query({
                    database_id: streamsDbId,
                    filter: { property: 'videoId', rich_text: { equals: stream.videoId } },
                });

                const properties: any = {
                    'Name': { title: [{ text: { content: stream.title } }] },
                    'videoId': { rich_text: [{ text: { content: stream.videoId } }] },
                    'actualStartTime': { date: { start: stream.actualStartTime } },
                    'actualEndTime': { date: { start: stream.actualEndTime } },
                    'thumbnailUrl': { url: stream.thumbnailUrl || null },
                    'viewCount': { number: stream.viewCount },
                    'likeCount': { number: stream.likeCount },
                    'commentCount': { number: stream.commentCount },
                    'duration': { rich_text: [{ text: { content: stream.duration } }] },
                    'commits': { rich_text: richTextChunks },
                    'projects': { relation: [{ id: ytProject.id }] },
                };

                if (existing.results.length > 0) {
                    await notion.pages.update({
                        page_id: existing.results[0].id,
                        properties,
                    });
                } else {
                    await notion.pages.create({
                        parent: { database_id: streamsDbId },
                        properties,
                    });
                }
            }
        } catch (err) {
            console.error(`Failed to process streams for ${ytProject.name}:`, err);
        }
    }
}

async function upsertActivity(
    activityDbId: string,
    externalId: string,
    properties: Record<string, any>,
) {
    const existing = await notion.databases.query({
        database_id: activityDbId,
        filter: { property: 'externalId', rich_text: { equals: externalId } },
    });

    if (existing.results.length > 0) {
        await notion.pages.update({
            page_id: existing.results[0].id,
            properties,
        });
    } else {
        await notion.pages.create({
            parent: { database_id: activityDbId },
            properties,
        });
    }
}

async function processActivity(projects: Project[]) {
    const activityDbId = process.env.NOTION_ACTIVITY_DB_ID;
    if (!activityDbId) return;

    // Find the most recent activity timestamp for incremental fetching
    let since: string;
    try {
        const existing = await notion.databases.query({
            database_id: activityDbId,
            sorts: [{ property: 'timestamp', direction: 'descending' }],
            page_size: 1,
        });
        if (existing.results.length > 0) {
            const page = existing.results[0] as any;
            since = page.properties?.timestamp?.date?.start || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        } else {
            since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        }
    } catch {
        since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    }

    // GitHub commits
    const githubProjects = projects.filter(p => p.platform === 'github' && p.platformAccountId);
    const commitsProvider = new GitHubCommitsProvider();

    for (const project of githubProjects) {
        try {
            const commits = await commitsProvider.getRecentCommits(project.platformAccountId!, since);
            for (const commit of commits) {
                const extId = `commit:${commit.sha}`;
                const payload = JSON.stringify({
                    sha: commit.sha,
                    message: commit.message,
                    author: commit.author,
                    htmlUrl: commit.htmlUrl,
                    repo: project.platformAccountId,
                });
                await upsertActivity(activityDbId, extId, {
                    'Name': { title: [{ text: { content: commit.message.split('\n')[0].slice(0, 100) } }] },
                    'type': { select: { name: 'commit' } },
                    'timestamp': { date: { start: commit.timestamp } },
                    'payload': { rich_text: chunkRichText(payload) },
                    'projectId': { rich_text: [{ text: { content: project.id } }] },
                    'projectName': { rich_text: [{ text: { content: project.name } }] },
                    'externalId': { rich_text: [{ text: { content: extId } }] },
                });
            }
        } catch (err) {
            console.error(`Failed to process activity commits for ${project.name}:`, err);
        }
    }

    // Tweets
    try {
        const twitterProvider = new TwitterProvider();
        const twitterProjects = projects.filter(p => (p.platform === 'twitter' || p.platform === 'x') && p.platformAccountId);

        for (const project of twitterProjects) {
            try {
                const tweets = await twitterProvider.getRecentTweets(project.platformAccountId!, since);
                for (const tweet of tweets) {
                    const extId = `tweet:${tweet.tweetId}`;
                    const payload = JSON.stringify({
                        text: tweet.text,
                        likeCount: tweet.likeCount,
                        retweetCount: tweet.retweetCount,
                        replyCount: tweet.replyCount,
                    });
                    await upsertActivity(activityDbId, extId, {
                        'Name': { title: [{ text: { content: tweet.text.slice(0, 100) } }] },
                        'type': { select: { name: 'tweet' } },
                        'timestamp': { date: { start: tweet.createdAt } },
                        'payload': { rich_text: chunkRichText(payload) },
                        'projectId': { rich_text: [{ text: { content: project.id } }] },
                        'projectName': { rich_text: [{ text: { content: project.name } }] },
                        'externalId': { rich_text: [{ text: { content: extId } }] },
                    });
                }
            } catch (err) {
                console.error(`Failed to process tweets for ${project.name}:`, err);
            }
        }
    } catch {
        // TwitterProvider constructor throws if no token — skip gracefully
    }

    // Stream events
    try {
        const streamsDbId = process.env.NOTION_STREAMS_DB_ID;
        if (streamsDbId) {
            const recentStreams = await notion.databases.query({
                database_id: streamsDbId,
                sorts: [{ property: 'actualStartTime', direction: 'descending' }],
                page_size: 20,
            });

            for (const page of recentStreams.results) {
                const p = page as any;
                if (!p.properties) continue;

                const name = p.properties.Name?.title?.[0]?.plain_text || '';
                const videoId = (p.properties.videoId?.rich_text || []).map((t: any) => t.plain_text).join('');
                const startTime = p.properties.actualStartTime?.date?.start;
                const endTime = p.properties.actualEndTime?.date?.start;
                const viewCount = p.properties.viewCount?.number || 0;
                const duration = (p.properties.duration?.rich_text || []).map((t: any) => t.plain_text).join('');

                if (!videoId) continue;

                // Upsert stream_start
                if (startTime) {
                    const startExtId = `stream_start:${videoId}`;
                    const startPayload = JSON.stringify({ streamName: name, videoId });
                    await upsertActivity(activityDbId, startExtId, {
                        'Name': { title: [{ text: { content: `Went live: ${name}`.slice(0, 100) } }] },
                        'type': { select: { name: 'stream_start' } },
                        'timestamp': { date: { start: startTime } },
                        'payload': { rich_text: chunkRichText(startPayload) },
                        'externalId': { rich_text: [{ text: { content: startExtId } }] },
                    });
                }

                // Upsert stream_end
                if (endTime) {
                    const endExtId = `stream_end:${videoId}`;
                    const endPayload = JSON.stringify({ streamName: name, videoId, viewCount, duration });
                    await upsertActivity(activityDbId, endExtId, {
                        'Name': { title: [{ text: { content: `Stream ended: ${name}`.slice(0, 100) } }] },
                        'type': { select: { name: 'stream_end' } },
                        'timestamp': { date: { start: endTime } },
                        'payload': { rich_text: chunkRichText(endPayload) },
                        'externalId': { rich_text: [{ text: { content: endExtId } }] },
                    });
                }
            }
        }
    } catch (err) {
        console.error('Failed to process stream activity events:', err);
    }
}

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const client = getDataClient();
        const projects = await client.getProjects();
        const metricsDbId = process.env.NOTION_METRICS_DB_ID || '';

        for (const project of projects) {
            if (!project.platform || !project.platformAccountId) continue;

            try {
                const provider = getMetricsProvider(project.platform);
                const metrics = await provider.getMetrics(project.platformAccountId);

                // Map the standardized SocialMetrics into an array of { name, value } for iterative upserting
                const metricEntries = [
                    { name: 'Subscribers', value: metrics.subscribers },
                    { name: 'Views', value: metrics.views },
                    { name: 'Videos', value: metrics.videos },
                    { name: 'Stars', value: metrics.stars },
                    { name: 'Forks', value: metrics.forks },
                    { name: 'Downloads', value: metrics.downloads },
                    { name: 'Weekly Downloads', value: metrics.weeklyDownloads },
                ].filter(m => m.value !== undefined) as Array<{ name: string; value: number }>;

                for (const entry of metricEntries) {
                    // Query Notion to see if this project already has this metric row
                    const existingMetrics = await notion.databases.query({
                        database_id: metricsDbId,
                        filter: {
                            and: [
                                { property: 'name', title: { equals: entry.name } },
                                { property: 'projects', relation: { contains: project.id } }
                            ]
                        }
                    });

                    // Upsert Logic
                    if (existingMetrics.results.length > 0) {
                        const existingPageId = existingMetrics.results[0].id;
                        await notion.pages.update({
                            page_id: existingPageId,
                            properties: {
                                'value': { number: entry.value }
                            }
                        });
                    } else {
                        await notion.pages.create({
                            parent: { database_id: metricsDbId },
                            properties: {
                                'name': { title: [{ text: { content: entry.name } }] },
                                'value': { number: entry.value },
                                'projects': { relation: [{ id: project.id }] },
                            },
                        });
                    }
                }
            } catch (err) {
                // Log and continue to the next project without failing the entire cron
                console.error(`Failed to process metrics for project ${project.name}:`, err);
            }
        }

        await processStreams(projects);
        await processActivity(projects);

        revalidatePath('/');
        revalidatePath('/streams');

        return NextResponse.json({ success: true, message: 'Updated metrics successfully.' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
