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
    filter?: object;
};

type DbQueryResponse = {
    results: Array<PageObjectResponse | PartialPageObjectResponse | PartialDatabaseObjectResponse | DatabaseObjectResponse>;
};

export async function queryNotionDb(args: NotionQueryArgs): Promise<DbQueryResponse> {
    // @ts-expect-error SDK is missing type definition for query
    return notion.databases.query(args);
}

export class NotionClient implements DataClient {
    async getProjects(): Promise<Project[]> {
        const response = await queryNotionDb({
            database_id: process.env.NOTION_PROJECTS_DB_ID || '',
            filter: { property: 'Status', status: { equals: 'Active' } },
        });

        const projects: Project[] = [];
        for (const page of response.results) {
            if (isPageObject(page)) {
                const props = page.properties as Record<string, NotionProp>;
                projects.push({
                    id: props.ID?.rich_text?.[0]?.plain_text || '',
                    name: props.Name?.title?.[0]?.plain_text || '',
                    type: props.Type?.select?.name || '',
                    status: props.Status?.status?.name || '',
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
                if (props.Amount?.number) totalRevenue += props.Amount.number;
            }
        }

        let totalCosts = 0;
        for (const page of costsResponse.results) {
            if (isPageObject(page)) {
                const props = page.properties as Record<string, NotionProp>;
                if (props.Amount?.number) totalCosts += props.Amount.number;
            }
        }

        return { totalRevenue, totalCosts, netProfit: totalRevenue - totalCosts };
    }

    async getProjectDetails(projectId: string): Promise<ProjectDetails | null> {
        const [projectRes, costsRes, revenueRes, metricsRes] = await Promise.all([
            queryNotionDb({
                database_id: process.env.NOTION_PROJECTS_DB_ID || '',
                filter: { property: 'ID', rich_text: { equals: projectId } }
            }),
            queryNotionDb({
                database_id: process.env.NOTION_COSTS_DB_ID || '',
                filter: { property: 'Project_ID', rich_text: { equals: projectId } }
            }),
            queryNotionDb({
                database_id: process.env.NOTION_REVENUE_DB_ID || '',
                filter: { property: 'Project_ID', rich_text: { equals: projectId } }
            }),
            queryNotionDb({
                database_id: process.env.NOTION_METRICS_DB_ID || '',
                filter: { property: 'Project_ID', rich_text: { equals: projectId } }
            })
        ]);

        if (projectRes.results.length === 0) return null;

        let project = { id: '', name: '', type: '', status: '' };
        const projectPage = projectRes.results[0];
        if (isPageObject(projectPage)) {
            const props = projectPage.properties as Record<string, NotionProp>;
            project = {
                id: props.ID?.rich_text?.[0]?.plain_text || '',
                name: props.Name?.title?.[0]?.plain_text || '',
                type: props.Type?.select?.name || '',
                status: props.Status?.status?.name || '',
            };
        }

        let totalCosts = 0;
        for (const page of costsRes.results) {
            if (isPageObject(page)) {
                const props = page.properties as Record<string, NotionProp>;
                if (props.Amount?.number) totalCosts += props.Amount.number;
            }
        }

        let totalRevenue = 0;
        for (const page of revenueRes.results) {
            if (isPageObject(page)) {
                const props = page.properties as Record<string, NotionProp>;
                if (props.Amount?.number) totalRevenue += props.Amount.number;
            }
        }

        const metrics: Array<{ name: string; value: number }> = [];
        for (const page of metricsRes.results) {
            if (isPageObject(page)) {
                const props = page.properties as Record<string, NotionProp>;
                const name = props['Metric Name']?.title?.[0]?.plain_text || '';
                const value = props.Value?.number || 0;
                if (name) metrics.push({ name, value });
            }
        }

        return { ...project, totalCosts, totalRevenue, netProfit: totalRevenue - totalCosts, metrics };
    }

    async getMultipleProjectDetails(ids: string[]): Promise<ProjectDetails[]> {
        const details = await Promise.all(ids.map(id => this.getProjectDetails(id)));
        return details.filter((d): d is ProjectDetails => d !== null);
    }
}
