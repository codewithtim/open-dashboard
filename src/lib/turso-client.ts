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
    companies as companiesTable,
    agents as agentsTable,
    agentCommits as agentCommitsTable,
    expenses as expensesTable,
    costProjects as costProjectsTable,
    projectServices as projectServicesTable,
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
    Company,
    Agent,
    AgentCommit,
    Expense,
    ExpenseSummary,
    ProjectService,
    CreateExpenseInput,
    CostAllocation,
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
        description: row.description || undefined,
        type: normalizeType(row.type),
        status: row.status.toLowerCase(),
        platform: row.platform?.toLowerCase() || undefined,
        platformAccountId: row.platformAccountId || undefined,
        link: buildLink(row.platform, row.platformAccountId, row.link),
        visibility: row.visibility,
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

        const [revenueResult, costsResult, expensesResult, metricsRows] = await Promise.all([
            db.select({ total: sql<number>`coalesce(sum(${revenueTable.amount}), 0)` }).from(revenueTable),
            db.select({ total: sql<number>`coalesce(sum(${costsTable.amount}), 0)` }).from(costsTable),
            db.select({ total: sql<number>`coalesce(sum(${expensesTable.amount}), 0)` }).from(expensesTable),
            db.select().from(metricsTable).where(inArray(metricsTable.projectId, activeIds)),
        ]);

        const totalRevenue = revenueResult[0]?.total ?? 0;
        const totalCosts = (costsResult[0]?.total ?? 0) + (expensesResult[0]?.total ?? 0);

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

        const [projectRows, costRows, revenueRows, expenseCostRows, metricRows] = await Promise.all([
            db.select().from(projectsTable).where(eq(projectsTable.id, projectId)),
            db.select({ total: sql<number>`coalesce(sum(${costsTable.amount}), 0)` }).from(costsTable).where(eq(costsTable.projectId, projectId)),
            db.select({ total: sql<number>`coalesce(sum(${revenueTable.amount}), 0)` }).from(revenueTable).where(eq(revenueTable.projectId, projectId)),
            db.select({ total: sql<number>`coalesce(sum(${expensesTable.amount} * ${costProjectsTable.allocation}), 0)` })
                .from(costProjectsTable)
                .leftJoin(expensesTable, eq(expensesTable.id, costProjectsTable.costId))
                .where(eq(costProjectsTable.projectId, projectId)),
            db.select().from(metricsTable).where(eq(metricsTable.projectId, projectId)),
        ]);

        if (projectRows.length === 0) return null;

        const project = rowToProject(projectRows[0]);
        const totalCosts = (costRows[0]?.total ?? 0) + (expenseCostRows[0]?.total ?? 0);
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

        const [projectRows, costRows, revenueRows, expenseCostRows, metricRows] = await Promise.all([
            db.select().from(projectsTable).where(inArray(projectsTable.id, ids)),
            db.select({ projectId: costsTable.projectId, total: sql<number>`coalesce(sum(${costsTable.amount}), 0)` })
                .from(costsTable)
                .where(inArray(costsTable.projectId, ids))
                .groupBy(costsTable.projectId),
            db.select({ projectId: revenueTable.projectId, total: sql<number>`coalesce(sum(${revenueTable.amount}), 0)` })
                .from(revenueTable)
                .where(inArray(revenueTable.projectId, ids))
                .groupBy(revenueTable.projectId),
            db.select({ projectId: costProjectsTable.projectId, total: sql<number>`coalesce(sum(${expensesTable.amount} * ${costProjectsTable.allocation}), 0)` })
                .from(costProjectsTable)
                .leftJoin(expensesTable, eq(expensesTable.id, costProjectsTable.costId))
                .where(inArray(costProjectsTable.projectId, ids))
                .groupBy(costProjectsTable.projectId),
            db.select().from(metricsTable).where(inArray(metricsTable.projectId, ids)),
        ]);

        const costsMap = new Map(costRows.map(r => [r.projectId, r.total]));
        const expenseCostsMap = new Map(expenseCostRows.map(r => [r.projectId, r.total]));
        const revenueMap = new Map(revenueRows.map(r => [r.projectId, r.total]));
        const metricsMap = new Map<string, Metric[]>();
        for (const m of metricRows) {
            if (!metricsMap.has(m.projectId)) metricsMap.set(m.projectId, []);
            metricsMap.get(m.projectId)!.push({ name: m.name, value: m.value });
        }

        return projectRows.map(row => {
            const project = rowToProject(row);
            const totalCosts = (costsMap.get(row.id) ?? 0) + (expenseCostsMap.get(row.id) ?? 0);
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

        const [commitRows, projectLinks] = await Promise.all([
            db.select({
                streamId: streamCommits.streamId,
                projectId: streamCommits.projectId,
            })
                .from(streamCommits)
                .where(inArray(streamCommits.streamId, streamIds)),
            db.select()
                .from(streamProjects)
                .where(inArray(streamProjects.streamId, streamIds)),
        ]);

        const commitCountMap = new Map<string, number>();
        const commitProjectIdsMap = new Map<string, Set<string>>();
        for (const row of commitRows) {
            commitCountMap.set(row.streamId, (commitCountMap.get(row.streamId) ?? 0) + 1);
            if (row.projectId) {
                if (!commitProjectIdsMap.has(row.streamId)) commitProjectIdsMap.set(row.streamId, new Set());
                commitProjectIdsMap.get(row.streamId)!.add(row.projectId);
            }
        }

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
            projectIds: [...new Set([
                ...(projectIdsMap.get(row.id) ?? []),
                ...(commitProjectIdsMap.get(row.id) ?? []),
            ])],
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

    async getCompanies(): Promise<Company[]> {
        const db = getDb();
        const rows = await db.select().from(companiesTable);
        return rows.map(row => ({
            id: row.id,
            name: row.name,
            slug: row.slug,
            website: row.website || undefined,
            description: row.description || undefined,
            logoUrl: row.logoUrl || undefined,
            parentId: row.parentId || undefined,
            createdAt: row.createdAt,
        }));
    }

    async getAgents(): Promise<Agent[]> {
        const db = getDb();
        const rows = await db
            .select({
                id: agentsTable.id,
                name: agentsTable.name,
                identifier: agentsTable.identifier,
                description: agentsTable.description,
                companyId: agentsTable.companyId,
                companyName: companiesTable.name,
                status: agentsTable.status,
                currentTask: agentsTable.currentTask,
                lastSeenAt: agentsTable.lastSeenAt,
                createdAt: agentsTable.createdAt,
            })
            .from(agentsTable)
            .leftJoin(companiesTable, eq(agentsTable.companyId, companiesTable.id));
        return rows.map(row => ({
            id: row.id,
            name: row.name,
            identifier: row.identifier,
            description: row.description || undefined,
            companyId: row.companyId || undefined,
            companyName: row.companyName || undefined,
            status: row.status,
            currentTask: row.currentTask || undefined,
            lastSeenAt: row.lastSeenAt || undefined,
            createdAt: row.createdAt,
        }));
    }

    async getAgentCommits(limit: number = 50): Promise<AgentCommit[]> {
        const db = getDb();
        const rows = await db
            .select({
                id: agentCommitsTable.id,
                agentId: agentCommitsTable.agentId,
                repoFullName: agentCommitsTable.repoFullName,
                sha: agentCommitsTable.sha,
                message: agentCommitsTable.message,
                author: agentCommitsTable.author,
                timestamp: agentCommitsTable.timestamp,
                htmlUrl: agentCommitsTable.htmlUrl,
                agentName: agentsTable.name,
            })
            .from(agentCommitsTable)
            .leftJoin(agentsTable, eq(agentCommitsTable.agentId, agentsTable.id))
            .orderBy(desc(agentCommitsTable.timestamp))
            .limit(limit);

        return rows.map(row => ({
            id: row.id,
            agentId: row.agentId,
            repoFullName: row.repoFullName,
            sha: row.sha,
            message: row.message || '',
            author: row.author || '',
            timestamp: row.timestamp || '',
            htmlUrl: row.htmlUrl || '',
            agentName: row.agentName || undefined,
        }));
    }

    async getExpenses(): Promise<Expense[]> {
        const db = getDb();
        const rows = await db
            .select({
                id: expensesTable.id,
                amount: expensesTable.amount,
                vendor: expensesTable.vendor,
                category: expensesTable.category,
                note: expensesTable.note,
                date: expensesTable.date,
                periodStart: expensesTable.periodStart,
                periodEnd: expensesTable.periodEnd,
                source: expensesTable.source,
                sourceRef: expensesTable.sourceRef,
                recurring: expensesTable.recurring,
                currency: expensesTable.currency,
                createdAt: expensesTable.createdAt,
                allocationProjectId: costProjectsTable.projectId,
                allocation: costProjectsTable.allocation,
                projectName: projectsTable.name,
            })
            .from(expensesTable)
            .leftJoin(costProjectsTable, eq(costProjectsTable.costId, expensesTable.id))
            .leftJoin(projectsTable, eq(projectsTable.id, costProjectsTable.projectId));

        return this.assembleExpenses(rows);
    }

    async getExpensesByProject(projectId: string): Promise<Expense[]> {
        const db = getDb();
        const rows = await db
            .select({
                id: expensesTable.id,
                amount: expensesTable.amount,
                vendor: expensesTable.vendor,
                category: expensesTable.category,
                note: expensesTable.note,
                date: expensesTable.date,
                periodStart: expensesTable.periodStart,
                periodEnd: expensesTable.periodEnd,
                source: expensesTable.source,
                sourceRef: expensesTable.sourceRef,
                recurring: expensesTable.recurring,
                currency: expensesTable.currency,
                createdAt: expensesTable.createdAt,
                allocationProjectId: costProjectsTable.projectId,
                allocation: costProjectsTable.allocation,
                projectName: projectsTable.name,
            })
            .from(expensesTable)
            .leftJoin(costProjectsTable, eq(costProjectsTable.costId, expensesTable.id))
            .leftJoin(projectsTable, eq(projectsTable.id, costProjectsTable.projectId))
            .where(eq(costProjectsTable.projectId, projectId));

        return this.assembleExpenses(rows);
    }

    async createExpense(input: CreateExpenseInput, allocations: CostAllocation[]): Promise<Expense> {
        const db = getDb();
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await db.insert(expensesTable).values({
            id,
            amount: input.amount,
            vendor: input.vendor,
            category: input.category,
            note: input.note ?? null,
            date: input.date,
            periodStart: input.periodStart ?? null,
            periodEnd: input.periodEnd ?? null,
            source: input.source ?? 'manual',
            sourceRef: input.sourceRef ?? null,
            recurring: input.recurring ?? false,
            currency: input.currency ?? 'USD',
            createdAt: now,
        });

        for (const alloc of allocations) {
            await db.insert(costProjectsTable).values({
                id: crypto.randomUUID(),
                costId: id,
                projectId: alloc.projectId,
                allocation: alloc.allocation,
            });
        }

        return {
            id,
            amount: input.amount,
            vendor: input.vendor,
            category: input.category,
            note: input.note,
            date: input.date,
            periodStart: input.periodStart,
            periodEnd: input.periodEnd,
            source: input.source ?? 'manual',
            sourceRef: input.sourceRef,
            recurring: input.recurring ?? false,
            currency: input.currency ?? 'USD',
            createdAt: now,
            allocations,
        };
    }

    async getExpenseSummary(): Promise<ExpenseSummary> {
        const db = getDb();
        const rows = await db
            .select({
                id: expensesTable.id,
                amount: expensesTable.amount,
                category: expensesTable.category,
                vendor: expensesTable.vendor,
            })
            .from(expensesTable);

        const byCategory: Record<string, number> = {};
        const byVendor: Record<string, number> = {};
        let totalAmount = 0;

        for (const row of rows) {
            totalAmount += row.amount;
            byCategory[row.category] = (byCategory[row.category] ?? 0) + row.amount;
            byVendor[row.vendor] = (byVendor[row.vendor] ?? 0) + row.amount;
        }

        return { totalAmount, count: rows.length, byCategory, byVendor };
    }

    async getProjectServices(projectId: string): Promise<ProjectService[]> {
        const db = getDb();
        const rows = await db
            .select()
            .from(projectServicesTable)
            .where(eq(projectServicesTable.projectId, projectId));

        return rows.map(r => ({
            id: r.id,
            projectId: r.projectId,
            vendor: r.vendor,
            exclusive: r.exclusive,
        }));
    }

    async getAllProjectServices(): Promise<ProjectService[]> {
        const db = getDb();
        const rows = await db.select().from(projectServicesTable);
        return rows.map(r => ({
            id: r.id,
            projectId: r.projectId,
            vendor: r.vendor,
            exclusive: r.exclusive,
        }));
    }

    async updateProjectServices(projectId: string, services: { vendor: string; exclusive: boolean }[]): Promise<void> {
        const db = getDb();
        await db.delete(projectServicesTable).where(eq(projectServicesTable.projectId, projectId));

        for (const svc of services) {
            await db.insert(projectServicesTable).values({
                id: crypto.randomUUID(),
                projectId,
                vendor: svc.vendor,
                exclusive: svc.exclusive,
            });
        }
    }

    private assembleExpenses(rows: any[]): Expense[] {
        const map = new Map<string, Expense>();

        for (const row of rows) {
            if (!map.has(row.id)) {
                map.set(row.id, {
                    id: row.id,
                    amount: row.amount,
                    vendor: row.vendor,
                    category: row.category,
                    note: row.note || undefined,
                    date: row.date,
                    periodStart: row.periodStart || undefined,
                    periodEnd: row.periodEnd || undefined,
                    source: row.source,
                    sourceRef: row.sourceRef || undefined,
                    recurring: row.recurring,
                    currency: row.currency,
                    createdAt: row.createdAt,
                    allocations: [],
                });
            }
            if (row.allocationProjectId) {
                map.get(row.id)!.allocations.push({
                    projectId: row.allocationProjectId,
                    projectName: row.projectName || undefined,
                    allocation: row.allocation,
                });
            }
        }

        return Array.from(map.values());
    }
}
