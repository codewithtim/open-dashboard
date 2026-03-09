import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { eq, desc } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import {
    metrics as metricsTable,
    streams as streamsTable,
    streamProjects,
    streamCommits,
    activityEvents,
    agents as agentsTable,
    agentRepos as agentReposTable,
    agentCommits as agentCommitsTable,
} from '@/lib/db/schema';
import { getDataClient } from '@/lib/client-factory';
import { getMetricsProvider } from '@/lib/providers';
import { YouTubeStreamsProvider } from '@/lib/providers/youtube-streams-provider';
import { GitHubCommitsProvider } from '@/lib/providers/github-commits-provider';
import { TwitterProvider } from '@/lib/providers/twitter-provider';
import { StreamCommit } from '@/lib/data-client';
import { Project } from '@/lib/data-client';

function generateId(): string {
    return crypto.randomUUID();
}

async function processStreams(projects: Project[]) {
    const db = getDb();

    const youtubeProjects = projects.filter(p => p.platform === 'youtube' && p.platformAccountId);
    const githubProjects = projects.filter(p => p.platform === 'github' && p.platformAccountId);

    if (youtubeProjects.length === 0) return;

    // Find the most recent stream start time for incremental fetching
    let since: string | undefined;
    try {
        const recent = await db
            .select({ actualStartTime: streamsTable.actualStartTime })
            .from(streamsTable)
            .orderBy(desc(streamsTable.actualStartTime))
            .limit(1);
        if (recent.length > 0 && recent[0].actualStartTime) {
            since = recent[0].actualStartTime;
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
            const ytStreams = await streamsProvider.getStreams(ytProject.platformAccountId!, since);

            for (const stream of ytStreams) {
                // Fetch commits from all GitHub repos within the stream window
                // For live streams without an end time, use current time
                const commitWindowEnd = stream.actualEndTime || new Date().toISOString();
                const allCommits: StreamCommit[] = [];
                for (const ghProject of githubProjects) {
                    try {
                        const ghCommits = await commitsProvider.getCommitsInWindow(
                            ghProject.platformAccountId!,
                            stream.actualStartTime,
                            commitWindowEnd,
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

                // Upsert stream by videoId
                const existing = await db
                    .select({ id: streamsTable.id })
                    .from(streamsTable)
                    .where(eq(streamsTable.videoId, stream.videoId));

                const streamId = existing.length > 0 ? existing[0].id : generateId();

                if (existing.length > 0) {
                    await db.update(streamsTable).set({
                        name: stream.title,
                        actualStartTime: stream.actualStartTime,
                        actualEndTime: stream.actualEndTime || null,
                        thumbnailUrl: stream.thumbnailUrl || null,
                        viewCount: stream.viewCount,
                        likeCount: stream.likeCount,
                        commentCount: stream.commentCount,
                        duration: stream.duration,
                    }).where(eq(streamsTable.id, streamId));
                } else {
                    await db.insert(streamsTable).values({
                        id: streamId,
                        name: stream.title,
                        videoId: stream.videoId,
                        actualStartTime: stream.actualStartTime,
                        actualEndTime: stream.actualEndTime || null,
                        thumbnailUrl: stream.thumbnailUrl || null,
                        viewCount: stream.viewCount,
                        likeCount: stream.likeCount,
                        commentCount: stream.commentCount,
                        duration: stream.duration,
                    });
                }

                // Upsert stream↔project link
                await db.insert(streamProjects).values({
                    streamId,
                    projectId: ytProject.id,
                }).onConflictDoNothing();

                // Replace commits for this stream
                await db.delete(streamCommits).where(eq(streamCommits.streamId, streamId));
                if (allCommits.length > 0) {
                    await db.insert(streamCommits).values(
                        allCommits.map(c => ({
                            streamId,
                            sha: c.sha,
                            message: c.message,
                            author: c.author,
                            timestamp: c.timestamp,
                            htmlUrl: c.htmlUrl,
                            repo: c.repo,
                            projectId: c.projectId,
                        }))
                    );
                }
            }
        } catch (err) {
            console.error(`Failed to process streams for ${ytProject.name}:`, err);
        }
    }
}

async function processActivity(projects: Project[]) {
    const db = getDb();

    // Find the most recent activity timestamp for incremental fetching
    let since: string;
    try {
        const recent = await db
            .select({ timestamp: activityEvents.timestamp })
            .from(activityEvents)
            .orderBy(desc(activityEvents.timestamp))
            .limit(1);
        since = recent.length > 0
            ? recent[0].timestamp
            : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    } catch {
        since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    }

    // GitHub commits
    const githubProjects = projects.filter(p => p.platform === 'github' && p.platformAccountId);
    const commitsProvider = new GitHubCommitsProvider();

    for (const project of githubProjects) {
        try {
            const commits = await commitsProvider.getRecentCommits(project.platformAccountId!, since);
            const isPrivate = project.visibility === 'private';
            for (const commit of commits) {
                const extId = `commit:${commit.sha}`;
                const payload = JSON.stringify({
                    sha: commit.sha,
                    message: commit.message,
                    author: commit.author,
                    htmlUrl: commit.htmlUrl,
                    repo: project.platformAccountId,
                    isPrivate,
                });
                await db.insert(activityEvents).values({
                    id: generateId(),
                    type: 'commit',
                    timestamp: commit.timestamp,
                    projectId: project.id,
                    projectName: project.name,
                    externalId: extId,
                    payload,
                }).onConflictDoUpdate({
                    target: activityEvents.externalId,
                    set: { payload },
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
                    await db.insert(activityEvents).values({
                        id: generateId(),
                        type: 'tweet',
                        timestamp: tweet.createdAt,
                        projectId: project.id,
                        projectName: project.name,
                        externalId: extId,
                        payload,
                    }).onConflictDoUpdate({
                        target: activityEvents.externalId,
                        set: { payload },
                    });
                }
            } catch (err) {
                console.error(`Failed to process tweets for ${project.name}:`, err);
            }
        }
    } catch {
        // TwitterProvider constructor throws if no token — skip gracefully
    }

    // Stream events — read from Turso streams table
    try {
        const recentStreams = await db
            .select()
            .from(streamsTable)
            .orderBy(desc(streamsTable.actualStartTime))
            .limit(20);

        for (const stream of recentStreams) {
            if (!stream.videoId) continue;

            if (stream.actualStartTime) {
                const startExtId = `stream_start:${stream.videoId}`;
                const startPayload = JSON.stringify({ streamName: stream.name, videoId: stream.videoId });
                await db.insert(activityEvents).values({
                    id: generateId(),
                    type: 'stream_start',
                    timestamp: stream.actualStartTime,
                    externalId: startExtId,
                    payload: startPayload,
                }).onConflictDoNothing();
            }

            if (stream.actualEndTime) {
                const endExtId = `stream_end:${stream.videoId}`;
                const endPayload = JSON.stringify({
                    streamName: stream.name,
                    videoId: stream.videoId,
                    viewCount: stream.viewCount ?? 0,
                    duration: stream.duration || '',
                });
                await db.insert(activityEvents).values({
                    id: generateId(),
                    type: 'stream_end',
                    timestamp: stream.actualEndTime,
                    externalId: endExtId,
                    payload: endPayload,
                }).onConflictDoNothing();
            }
        }
    } catch (err) {
        console.error('Failed to process stream activity events:', err);
    }
}

async function processAgentCommits() {
    const db = getDb();

    // Load all agents and their repos
    const allAgents = await db.select().from(agentsTable);
    const allRepos = await db.select().from(agentReposTable);

    if (allAgents.length === 0 || allRepos.length === 0) return;

    // Build identifier→agent map
    const identifierToAgent = new Map<string, typeof allAgents[0]>();
    for (const agent of allAgents) {
        identifierToAgent.set(agent.identifier, agent);
    }

    // Find most recent agent commit timestamp for incremental fetching
    let since: string;
    try {
        const recent = await db
            .select({ timestamp: agentCommitsTable.timestamp })
            .from(agentCommitsTable)
            .orderBy(desc(agentCommitsTable.timestamp))
            .limit(1);
        since = recent.length > 0 && recent[0].timestamp
            ? recent[0].timestamp
            : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    } catch {
        since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    // Collect unique repos
    const uniqueRepos = [...new Set(allRepos.map(r => r.repoFullName))];
    const commitsProvider = new GitHubCommitsProvider();

    for (const repoFullName of uniqueRepos) {
        try {
            const commits = await commitsProvider.getRecentCommits(repoFullName, since);

            for (const commit of commits) {
                const agent = identifierToAgent.get(commit.author);
                if (!agent) continue;

                const extId = `agent_commit:${commit.sha}`;
                await db.insert(agentCommitsTable).values({
                    agentId: agent.id,
                    repoFullName,
                    sha: commit.sha,
                    message: commit.message,
                    author: commit.author,
                    timestamp: commit.timestamp,
                    htmlUrl: commit.htmlUrl,
                    externalId: extId,
                }).onConflictDoNothing();
            }
        } catch (err) {
            console.error(`Failed to process agent commits for ${repoFullName}:`, err);
        }
    }
}

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const db = getDb();
        const client = getDataClient();
        const projects = await client.getProjects();

        for (const project of projects) {
            if (!project.platform || !project.platformAccountId) continue;

            try {
                const provider = getMetricsProvider(project.platform);
                const fetchedMetrics = await provider.getMetrics(project.platformAccountId);

                const metricEntries = [
                    { name: 'Subscribers', value: fetchedMetrics.subscribers },
                    { name: 'Views', value: fetchedMetrics.views },
                    { name: 'Videos', value: fetchedMetrics.videos },
                    { name: 'Stars', value: fetchedMetrics.stars },
                    { name: 'Forks', value: fetchedMetrics.forks },
                    { name: 'Downloads', value: fetchedMetrics.downloads },
                    { name: 'Weekly Downloads', value: fetchedMetrics.weeklyDownloads },
                ].filter(m => m.value !== undefined) as Array<{ name: string; value: number }>;

                for (const entry of metricEntries) {
                    await db.insert(metricsTable).values({
                        id: generateId(),
                        projectId: project.id,
                        name: entry.name,
                        value: entry.value,
                    }).onConflictDoUpdate({
                        target: [metricsTable.projectId, metricsTable.name],
                        set: { value: entry.value },
                    });
                }
            } catch (err) {
                console.error(`Failed to process metrics for project ${project.name}:`, err);
            }
        }

        await processStreams(projects);
        await processActivity(projects);

        try {
            await processAgentCommits();
        } catch (err) {
            console.error('Failed to process agent commits:', err);
        }

        revalidatePath('/');
        revalidatePath('/streams');
        revalidatePath('/1hnai');

        return NextResponse.json({ success: true, message: 'Updated metrics successfully.' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
