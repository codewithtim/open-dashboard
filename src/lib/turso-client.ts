import { eq, sql, desc, inArray } from 'drizzle-orm';
import { getDb } from './db';
import {
    projects as projectsTable,
    revenue as revenueTable,
    costs as costsTable,
    metrics as metricsTable,
    streams as streamsTable,
    streamProjects,
    streamCommits,
    activityEvents,
} from './db/schema';
import {
    DataClient,
    Project,
    DashboardStats,
    ProjectDetails,
    Metric,
    StreamSummary,
    Stream,
    StreamCommit,
    ActivityEvent,
    ActivityEventType,
    ActivityEventPayload,
} from './data-client';

function normalizeType(raw: string): string {
    const lower = raw.toLowerCase();
    if (lower === 'package') return 'software';
    return lower;
}

function buildLink(platform?: string | null, accountId?: string | null, rawLink?: string | null): string | undefined {
    if (rawLink) return rawLink;
    if (!platform || !accountId) return undefined;
    const p = platform.toLowerCase();
    if (p === 'youtube') return `https://youtube.com/channel/${accountId}`;
    if (p === 'twitter' || p === 'x') return `https://x.com/${accountId}`;
    if (p === 'tiktok') return `https://tiktok.com/@${accountId}`;
    if (p === 'twitch') return `https://twitch.tv/${accountId}`;
    if (p === 'instagram' || p === 'ig') return `https://instagram.com/${accountId}`;
    if (p === 'github') return `https://github.com/${accountId}`;
    if (p === 'npm') return `https://www.npmjs.com/package/${accountId}`;
    return undefined;
}

function rowToProject(row: typeof projectsTable.$inferSelect): Project {
    return {
        id: row.id,
        name: row.name,
        type: normalizeType(row.type),
        status: row.status.toLowerCase(),
        platform: row.platform?.toLowerCase() || undefined,
        platformAccountId: row.platformAccountId || undefined,
        link: buildLink(row.platform, row.platformAccountId, row.link),
    };
}

export class TursoClient implements DataClient {
    async getProjects(): Promise<Project[]> {
        const db = getDb();
        const rows = await db
            .select()
            .from(projectsTable)
            .where(eq(projectsTable.status, 'active'));
        return rows.map(rowToProject);
    }

    async getAllProjects(): Promise<Project[]> {
        const db = getDb();
        const rows = await db.select().from(projectsTable);
        return rows.map(rowToProject);
    }

    async getAggregatedDashboardStats(): Promise<DashboardStats> {
        const db = getDb();

        const activeProjects = await db
            .select({ id: projectsTable.id })
            .from(projectsTable)
            .where(eq(projectsTable.status, 'active'));
        const activeIds = activeProjects.map(p => p.id);

        if (activeIds.length === 0) {
            return { totalRevenue: 0, totalCosts: 0, netProfit: 0, totalSubscribers: 0, totalViews: 0, totalActiveUsers: 0 };
        }

        const [revenueResult, costsResult, metricsRows] = await Promise.all([
            db.select({ total: sql<number>`coalesce(sum(${revenueTable.amount}), 0)` }).from(revenueTable),
            db.select({ total: sql<number>`coalesce(sum(${costsTable.amount}), 0)` }).from(costsTable),
            db.select().from(metricsTable).where(inArray(metricsTable.projectId, activeIds)),
        ]);

        const totalRevenue = revenueResult[0]?.total ?? 0;
        const totalCosts = costsResult[0]?.total ?? 0;

        let totalSubscribers = 0;
        let totalViews = 0;
        let totalActiveUsers = 0;

        for (const m of metricsRows) {
            const name = m.name.toLowerCase();
            if (name.includes('subscriber') || name.includes('follower')) {
                totalSubscribers += m.value;
            } else if (name.includes('view') || name.includes('impression')) {
                totalViews += m.value;
            } else if (name.includes('user') || name.includes('active')) {
                totalActiveUsers += m.value;
            }
        }

        return {
            totalRevenue,
            totalCosts,
            netProfit: totalRevenue - totalCosts,
            totalSubscribers,
            totalViews,
            totalActiveUsers,
        };
    }

    async getProjectDetails(projectId: string): Promise<ProjectDetails | null> {
        const db = getDb();

        const [projectRows, costRows, revenueRows, metricRows] = await Promise.all([
            db.select().from(projectsTable).where(eq(projectsTable.id, projectId)),
            db.select({ total: sql<number>`coalesce(sum(${costsTable.amount}), 0)` }).from(costsTable).where(eq(costsTable.projectId, projectId)),
            db.select({ total: sql<number>`coalesce(sum(${revenueTable.amount}), 0)` }).from(revenueTable).where(eq(revenueTable.projectId, projectId)),
            db.select().from(metricsTable).where(eq(metricsTable.projectId, projectId)),
        ]);

        if (projectRows.length === 0) return null;

        const project = rowToProject(projectRows[0]);
        const totalCosts = costRows[0]?.total ?? 0;
        const totalRevenue = revenueRows[0]?.total ?? 0;
        const projectMetrics: Metric[] = metricRows.map(m => ({ name: m.name, value: m.value }));

        return {
            ...project,
            totalCosts,
            totalRevenue,
            netProfit: totalRevenue - totalCosts,
            metrics: projectMetrics,
        };
    }

    async getMultipleProjectDetails(ids: string[]): Promise<ProjectDetails[]> {
        if (ids.length === 0) return [];

        const db = getDb();

        const [projectRows, costRows, revenueRows, metricRows] = await Promise.all([
            db.select().from(projectsTable).where(inArray(projectsTable.id, ids)),
            db.select({ projectId: costsTable.projectId, total: sql<number>`coalesce(sum(${costsTable.amount}), 0)` })
                .from(costsTable)
                .where(inArray(costsTable.projectId, ids))
                .groupBy(costsTable.projectId),
            db.select({ projectId: revenueTable.projectId, total: sql<number>`coalesce(sum(${revenueTable.amount}), 0)` })
                .from(revenueTable)
                .where(inArray(revenueTable.projectId, ids))
                .groupBy(revenueTable.projectId),
            db.select().from(metricsTable).where(inArray(metricsTable.projectId, ids)),
        ]);

        const costsMap = new Map(costRows.map(r => [r.projectId, r.total]));
        const revenueMap = new Map(revenueRows.map(r => [r.projectId, r.total]));
        const metricsMap = new Map<string, Metric[]>();
        for (const m of metricRows) {
            if (!metricsMap.has(m.projectId)) metricsMap.set(m.projectId, []);
            metricsMap.get(m.projectId)!.push({ name: m.name, value: m.value });
        }

        return projectRows.map(row => {
            const project = rowToProject(row);
            const totalCosts = costsMap.get(row.id) ?? 0;
            const totalRevenue = revenueMap.get(row.id) ?? 0;
            return {
                ...project,
                totalCosts,
                totalRevenue,
                netProfit: totalRevenue - totalCosts,
                metrics: metricsMap.get(row.id) ?? [],
            };
        });
    }

    async getStreams(): Promise<StreamSummary[]> {
        const db = getDb();

        const streamRows = await db
            .select()
            .from(streamsTable)
            .orderBy(desc(streamsTable.actualStartTime));

        if (streamRows.length === 0) return [];

        const streamIds = streamRows.map(s => s.id);

        const [commitCounts, projectLinks] = await Promise.all([
            db.select({
                streamId: streamCommits.streamId,
                count: sql<number>`count(*)`,
            })
                .from(streamCommits)
                .where(inArray(streamCommits.streamId, streamIds))
                .groupBy(streamCommits.streamId),
            db.select()
                .from(streamProjects)
                .where(inArray(streamProjects.streamId, streamIds)),
        ]);

        const commitCountMap = new Map(commitCounts.map(r => [r.streamId, r.count]));
        const projectIdsMap = new Map<string, string[]>();
        for (const link of projectLinks) {
            if (!projectIdsMap.has(link.streamId)) projectIdsMap.set(link.streamId, []);
            projectIdsMap.get(link.streamId)!.push(link.projectId);
        }

        return streamRows.map(row => ({
            id: row.id,
            name: row.name,
            videoId: row.videoId,
            actualStartTime: row.actualStartTime || '',
            actualEndTime: row.actualEndTime || '',
            thumbnailUrl: row.thumbnailUrl || '',
            viewCount: row.viewCount ?? 0,
            likeCount: row.likeCount ?? 0,
            commentCount: row.commentCount ?? 0,
            duration: row.duration || '',
            commitCount: commitCountMap.get(row.id) ?? 0,
            projectIds: projectIdsMap.get(row.id) ?? [],
        }));
    }

    async getStreamById(id: string): Promise<Stream | null> {
        const db = getDb();

        const streamRows = await db.select().from(streamsTable).where(eq(streamsTable.id, id));
        if (streamRows.length === 0) return null;

        const row = streamRows[0];

        const [commitRows, projectLinks] = await Promise.all([
            db.select().from(streamCommits).where(eq(streamCommits.streamId, id)),
            db.select().from(streamProjects).where(eq(streamProjects.streamId, id)),
        ]);

        const commits: StreamCommit[] = commitRows.map(c => ({
            sha: c.sha,
            message: c.message || '',
            author: c.author || '',
            timestamp: c.timestamp || '',
            htmlUrl: c.htmlUrl || '',
            repo: c.repo || '',
            projectId: c.projectId || '',
        }));

        return {
            id: row.id,
            name: row.name,
            videoId: row.videoId,
            actualStartTime: row.actualStartTime || '',
            actualEndTime: row.actualEndTime || '',
            thumbnailUrl: row.thumbnailUrl || '',
            viewCount: row.viewCount ?? 0,
            likeCount: row.likeCount ?? 0,
            commentCount: row.commentCount ?? 0,
            duration: row.duration || '',
            commits,
            projectIds: projectLinks.map(l => l.projectId),
        };
    }

    async getStreamCountForProject(projectId: string): Promise<number> {
        const db = getDb();
        const result = await db
            .select({ count: sql<number>`count(*)` })
            .from(streamProjects)
            .where(eq(streamProjects.projectId, projectId));
        return result[0]?.count ?? 0;
    }

    async getRecentActivity(limit: number = 20): Promise<ActivityEvent[]> {
        const db = getDb();
        const rows = await db
            .select()
            .from(activityEvents)
            .orderBy(desc(activityEvents.timestamp))
            .limit(limit);

        return rows.map(row => {
            let payload: ActivityEventPayload;
            try {
                payload = JSON.parse(row.payload);
            } catch {
                payload = { sha: '', message: '', author: '', htmlUrl: '', repo: '' };
            }

            return {
                id: row.id,
                type: row.type as ActivityEventType,
                timestamp: row.timestamp,
                projectId: row.projectId || undefined,
                projectName: row.projectName || undefined,
                externalId: row.externalId,
                payload,
            };
        });
    }
}
