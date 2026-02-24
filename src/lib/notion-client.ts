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
                projects.push({
                    id: page.id || '',
                    name: props.name?.title?.[0]?.plain_text || '',
                    type: props.type?.select?.name || '',
                    status: props.status?.select?.name || '',
                    platform: props.platform?.select?.name || undefined,
                });
            }
        }
        return projects;
    }

    async getAggregatedDashboardStats(): Promise<DashboardStats> {
        const [revenueResponse, costsResponse] = await Promise.all([
            queryNotionDb({ database_id: process.env.NOTION_REVENUE_DB_ID || '' }),
            queryNotionDb({ database_id: process.env.NOTION_COSTS_DB_ID || '' }),
        ]);

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

        return { totalRevenue, totalCosts, netProfit: totalRevenue - totalCosts };
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
            project = {
                id: projectPage.id,
                name: props.name?.title?.[0]?.plain_text || '',
                type: props.type?.select?.name || '',
                status: props.status?.select?.name || '',
                platform: props.platform?.select?.name || undefined,
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
                project = {
                    id: projectPage.id,
                    name: props.name?.title?.[0]?.plain_text || '',
                    type: props.type?.select?.name || '',
                    status: props.status?.select?.name || '',
                    platform: props.platform?.select?.name || undefined,
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
