import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { notion } from '@/lib/notion-client';
import { getDataClient } from '@/lib/client-factory';
import { getMetricsProvider } from '@/lib/providers';
import { YouTubeStreamsProvider } from '@/lib/providers/youtube-streams-provider';
import { GitHubCommitsProvider } from '@/lib/providers/github-commits-provider';
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
                    'name': { title: [{ text: { content: stream.title } }] },
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

        revalidatePath('/');
        revalidatePath('/streams');

        return NextResponse.json({ success: true, message: 'Updated metrics successfully.' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
