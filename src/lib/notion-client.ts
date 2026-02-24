import { Client } from '@notionhq/client';
import { PageObjectResponse, PartialPageObjectResponse, PartialDatabaseObjectResponse, DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints';

import { DataClient, Project, DashboardStats, ProjectDetails, Metric } from './data-client';

export const notion = new Client({
    auth: process.env.NOTION_TOKEN,
});

type NotionText = { plain_text: string };
type NotionProp = {
    rich_text?: NotionText[];
    title?: NotionText[];
    select?: { name: string } | null;
    status?: { name: string } | null;
    number?: number | null;
    url?: string | null;
};

function isPageObject(
    item: PageObjectResponse | PartialPageObjectResponse | PartialDatabaseObjectResponse | DatabaseObjectResponse
): item is PageObjectResponse {
    return 'properties' in item;
}

type NotionQueryArgs = {
    database_id: string;
    filter?: any;
};

type DbQueryResponse = {
    results: Array<PageObjectResponse | PartialPageObjectResponse | PartialDatabaseObjectResponse | DatabaseObjectResponse>;
};

export async function queryNotionDb(args: NotionQueryArgs): Promise<DbQueryResponse> {
    return notion.databases.query(args);
}

export class NotionClient implements DataClient {
    async getProjects(): Promise<Project[]> {
        const response = await queryNotionDb({
            database_id: process.env.NOTION_PROJECTS_DB_ID || '',
            filter: { property: 'status', select: { equals: 'active' } },
        });

        const projects: Project[] = [];
        for (const page of response.results) {
            if (isPageObject(page)) {
                const props = page.properties as Record<string, NotionProp>;
                const platform = props.platform?.select?.name || undefined;
                const platformAccountId = props['Platform Account ID']?.rich_text?.[0]?.plain_text || undefined;
                let link = props.Link?.url || undefined;
                if (!link && platformAccountId) {
                    if (platform === 'youtube') link = `https://youtube.com/channel/${platformAccountId}`;
                    else if (platform === 'twitter' || platform === 'x') link = `https://x.com/${platformAccountId}`;
                    else if (platform === 'tiktok') link = `https://tiktok.com/@${platformAccountId}`;
                    else if (platform === 'twitch') link = `https://twitch.tv/${platformAccountId}`;
                }

                projects.push({
                    id: page.id || '',
                    name: props.name?.title?.[0]?.plain_text || '',
                    type: props.type?.select?.name || '',
                    status: props.status?.select?.name || '',
                    platform,
                    platformAccountId,
                    link,
                });
            }
        }
        return projects;
    }

    async getAggregatedDashboardStats(): Promise<DashboardStats> {
        const [projectsResponse, revenueResponse, costsResponse, metricsResponse] = await Promise.all([
            queryNotionDb({
                database_id: process.env.NOTION_PROJECTS_DB_ID || '',
                filter: { property: 'status', select: { equals: 'active' } },
            }),
            queryNotionDb({ database_id: process.env.NOTION_REVENUE_DB_ID || '' }),
            queryNotionDb({ database_id: process.env.NOTION_COSTS_DB_ID || '' }),
            queryNotionDb({ database_id: process.env.NOTION_METRICS_DB_ID || '' }),
        ]);

        const activeProjectIds = new Set(projectsResponse.results.map(p => p.id));

        let totalRevenue = 0;
        for (const page of revenueResponse.results) {
            if (isPageObject(page)) {
                const props = page.properties as Record<string, NotionProp>;
                if (props.amount?.number) totalRevenue += props.amount.number;
            }
        }

        let totalCosts = 0;
        for (const page of costsResponse.results) {
            if (isPageObject(page)) {
                const props = page.properties as Record<string, NotionProp>;
                if (props.amount?.number) totalCosts += props.amount.number;
            }
        }

        let totalSubscribers = 0;
        let totalViews = 0;
        let totalActiveUsers = 0;
        let totalTwitterFollowers = 0;
        let totalTiktokFollowers = 0;
        let totalTwitchFollowers = 0;

        for (const page of metricsResponse.results) {
            if (isPageObject(page)) {
                const props = page.properties as any;
                const relations = props.projects?.relation as Array<{ id: string }>;

                // Only aggregate metrics that belong to an Active project
                if (relations?.some(r => activeProjectIds.has(r.id))) {
                    const name = props.name?.title?.[0]?.plain_text?.toLowerCase() || '';
                    const value = props.value?.number || 0;

                    if (name.includes('subscriber')) totalSubscribers += value;
                    if (name.includes('view')) totalViews += value;
                    if (name.includes('user') || name.includes('active')) totalActiveUsers += value;
                    if (name.includes('twitter') || name.includes(' x ')) totalTwitterFollowers += value;
                    if (name.includes('tiktok')) totalTiktokFollowers += value;
                    if (name.includes('twitch')) totalTwitchFollowers += value;
                }
            }
        }

        return {
            totalRevenue,
            totalCosts,
            netProfit: totalRevenue - totalCosts,
            totalSubscribers,
            totalViews,
            totalActiveUsers,
            totalTwitterFollowers,
            totalTiktokFollowers,
            totalTwitchFollowers
        };
    }

    async getProjectDetails(projectId: string): Promise<ProjectDetails | null> {
        const [projectRes, costsRes, revenueRes, metricsRes] = await Promise.all([
            queryNotionDb({
                database_id: process.env.NOTION_PROJECTS_DB_ID || ''
                // We'll filter for the exact page inside the DB to grab its properties
            }),
            queryNotionDb({
                database_id: process.env.NOTION_COSTS_DB_ID || '',
                filter: { property: 'projects', relation: { contains: projectId } }
            }),
            queryNotionDb({
                database_id: process.env.NOTION_REVENUE_DB_ID || '',
                filter: { property: 'projects', relation: { contains: projectId } }
            }),
            queryNotionDb({
                database_id: process.env.NOTION_METRICS_DB_ID || '',
                filter: { property: 'projects', relation: { contains: projectId } }
            })
        ]);

        const projectPage = projectRes.results.find(p => p.id === projectId);
        if (!projectPage) return null;

        let project: Project = { id: '', name: '', type: '', status: '' };
        if (isPageObject(projectPage)) {
            const props = projectPage.properties as Record<string, NotionProp>;
            const platform = props.platform?.select?.name || undefined;
            const platformAccountId = props['Platform Account ID']?.rich_text?.[0]?.plain_text || undefined;
            let link = props.Link?.url || undefined;
            if (!link && platformAccountId) {
                if (platform === 'youtube') link = `https://youtube.com/channel/${platformAccountId}`;
                else if (platform === 'twitter' || platform === 'x') link = `https://x.com/${platformAccountId}`;
                else if (platform === 'tiktok') link = `https://tiktok.com/@${platformAccountId}`;
                else if (platform === 'twitch') link = `https://twitch.tv/${platformAccountId}`;
            }

            project = {
                id: projectPage.id,
                name: props.name?.title?.[0]?.plain_text || '',
                type: props.type?.select?.name || '',
                status: props.status?.select?.name || '',
                platform,
                platformAccountId,
                link,
            };
        }

        let totalCosts = 0;
        for (const page of costsRes.results) {
            if (isPageObject(page)) {
                const props = page.properties as Record<string, NotionProp>;
                if (props.amount?.number) totalCosts += props.amount.number;
            }
        }

        let totalRevenue = 0;
        for (const page of revenueRes.results) {
            if (isPageObject(page)) {
                const props = page.properties as Record<string, NotionProp>;
                if (props.amount?.number) totalRevenue += props.amount.number;
            }
        }

        const metrics: Array<{ name: string; value: number }> = [];
        for (const page of metricsRes.results) {
            if (isPageObject(page)) {
                const props = page.properties as Record<string, NotionProp>;
                const name = props.name?.title?.[0]?.plain_text || '';
                const value = props.value?.number || 0;
                if (name) metrics.push({ name, value });
            }
        }

        return { ...project, totalCosts, totalRevenue, netProfit: totalRevenue - totalCosts, metrics };
    }

    async getMultipleProjectDetails(ids: string[]): Promise<ProjectDetails[]> {
        if (ids.length === 0) return [];

        // 1. Fetch exactly the projects we need if we don't have them globally cached, 
        // Or in this case we'll fetch all active projects to filter them
        const [projectRes, costsRes, revenueRes, metricsRes] = await Promise.all([
            queryNotionDb({
                database_id: process.env.NOTION_PROJECTS_DB_ID || ''
            }),
            queryNotionDb({
                database_id: process.env.NOTION_COSTS_DB_ID || '' // Bulk fetch all costs
            }),
            queryNotionDb({
                database_id: process.env.NOTION_REVENUE_DB_ID || '' // Bulk fetch all revenue
            }),
            queryNotionDb({
                database_id: process.env.NOTION_METRICS_DB_ID || '' // Bulk fetch all metrics
            })
        ]);

        const detailsList: ProjectDetails[] = [];

        for (const id of ids) {
            const projectPage = projectRes.results.find(p => p.id === id);
            if (!projectPage) continue;

            let project: Project = { id: '', name: '', type: '', status: '' };
            if (isPageObject(projectPage)) {
                const props = projectPage.properties as Record<string, NotionProp>;
                const platform = props.platform?.select?.name || undefined;
                const platformAccountId = props['Platform Account ID']?.rich_text?.[0]?.plain_text || undefined;
                let link = props.Link?.url || undefined;
                if (!link && platformAccountId) {
                    if (platform === 'youtube') link = `https://youtube.com/channel/${platformAccountId}`;
                    else if (platform === 'twitter' || platform === 'x') link = `https://x.com/${platformAccountId}`;
                    else if (platform === 'tiktok') link = `https://tiktok.com/@${platformAccountId}`;
                    else if (platform === 'twitch') link = `https://twitch.tv/${platformAccountId}`;
                }

                project = {
                    id: projectPage.id,
                    name: props.name?.title?.[0]?.plain_text || '',
                    type: props.type?.select?.name || '',
                    status: props.status?.select?.name || '',
                    platform,
                    platformAccountId,
                    link,
                };
            }

            // A helper to check if a relation property contains the current Project ID
            const relatesToId = (page: PageObjectResponse | PartialPageObjectResponse | PartialDatabaseObjectResponse | DatabaseObjectResponse) => {
                if (isPageObject(page)) {
                    const props = page.properties as any;
                    const relations = props.projects?.relation as Array<{ id: string }>;
                    return relations?.some(r => r.id === id) || false;
                }
                return false;
            };

            let totalCosts = 0;
            for (const page of costsRes.results) {
                if (relatesToId(page) && isPageObject(page)) {
                    const props = page.properties as Record<string, NotionProp>;
                    if (props.amount?.number) totalCosts += props.amount.number;
                }
            }

            let totalRevenue = 0;
            for (const page of revenueRes.results) {
                if (relatesToId(page) && isPageObject(page)) {
                    const props = page.properties as Record<string, NotionProp>;
                    if (props.amount?.number) totalRevenue += props.amount.number;
                }
            }

            const metrics: Array<{ name: string; value: number }> = [];
            for (const page of metricsRes.results) {
                if (relatesToId(page) && isPageObject(page)) {
                    const props = page.properties as Record<string, NotionProp>;
                    const name = props.name?.title?.[0]?.plain_text || '';
                    const value = props.value?.number || 0;
                    if (name) metrics.push({ name, value });
                }
            }

            detailsList.push({
                ...project,
                totalCosts,
                totalRevenue,
                netProfit: totalRevenue - totalCosts,
                metrics
            });
        }

        return detailsList;
    }
}
