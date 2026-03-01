import { Client } from '@notionhq/client';
import { PageObjectResponse, PartialPageObjectResponse, PartialDatabaseObjectResponse, DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints';

import { DataClient, Project, DashboardStats, ProjectDetails, Metric, StreamSummary, Stream, StreamCommit } from './data-client';

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
    date?: { start: string } | null;
    relation?: Array<{ id: string }>;
};

function isPageObject(
    item: PageObjectResponse | PartialPageObjectResponse | PartialDatabaseObjectResponse | DatabaseObjectResponse
): item is PageObjectResponse {
    return 'properties' in item;
}

/** Normalize Notion property keys to lowercase so casing mismatches don't matter. */
function normalizeProps(properties: Record<string, any>): Record<string, NotionProp> {
    const normalized: Record<string, NotionProp> = {};
    for (const [key, value] of Object.entries(properties)) {
        normalized[key.toLowerCase()] = value;
    }
    return normalized;
}

/** Normalize type values so all code/package projects display as 'software'. */
function normalizeType(raw: string): string {
    const lower = raw.toLowerCase();
    if (lower === 'package') return 'software';
    return lower;
}

type NotionQueryArgs = {
    database_id: string;
    filter?: any;
    sorts?: any[];
};

type DbQueryResponse = {
    results: Array<PageObjectResponse | PartialPageObjectResponse | PartialDatabaseObjectResponse | DatabaseObjectResponse>;
};

export async function queryNotionDb(args: NotionQueryArgs): Promise<DbQueryResponse> {
    return notion.databases.query(args);
}

function parseProjectFromProps(pageId: string, props: Record<string, NotionProp>): Project {
    const platform = props.platform?.select?.name?.toLowerCase() || undefined;
    const platformAccountId = props['platform account id']?.rich_text?.[0]?.plain_text || undefined;
    let link = props.link?.url || undefined;
    if (!link && platformAccountId) {
        if (platform === 'youtube') link = `https://youtube.com/channel/${platformAccountId}`;
        else if (platform === 'twitter' || platform === 'x') link = `https://x.com/${platformAccountId}`;
        else if (platform === 'tiktok') link = `https://tiktok.com/@${platformAccountId}`;
        else if (platform === 'twitch') link = `https://twitch.tv/${platformAccountId}`;
        else if (platform === 'instagram' || platform === 'ig') link = `https://instagram.com/${platformAccountId}`;
        else if (platform === 'github') link = `https://github.com/${platformAccountId}`;
        else if (platform === 'npm') link = `https://www.npmjs.com/package/${platformAccountId}`;
    }

    return {
        id: pageId,
        name: props.name?.title?.[0]?.plain_text || '',
        type: normalizeType(props.type?.select?.name || ''),
        status: (props.status?.select?.name || '').toLowerCase(),
        platform,
        platformAccountId,
        link,
    };
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
                const props = normalizeProps(page.properties);
                projects.push(parseProjectFromProps(page.id || '', props));
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
                const props = normalizeProps(page.properties);
                if (props.amount?.number) totalRevenue += props.amount.number;
            }
        }

        let totalCosts = 0;
        for (const page of costsResponse.results) {
            if (isPageObject(page)) {
                const props = normalizeProps(page.properties);
                if (props.amount?.number) totalCosts += props.amount.number;
            }
        }

        let totalSubscribers = 0;
        let totalViews = 0;
        let totalActiveUsers = 0;

        for (const page of metricsResponse.results) {
            if (isPageObject(page)) {
                const props = normalizeProps(page.properties);
                const relations = props.projects?.relation as Array<{ id: string }>;

                // Only aggregate metrics that belong to an Active project
                if (relations?.some(r => activeProjectIds.has(r.id))) {
                    const name = props.name?.title?.[0]?.plain_text?.toLowerCase() || '';
                    const value = props.value?.number || 0;

                    if (name.includes('subscriber') || name.includes('follower')) {
                        totalSubscribers += value;
                    } else if (name.includes('view') || name.includes('impression')) {
                        totalViews += value;
                    } else if (name.includes('user') || name.includes('active')) {
                        totalActiveUsers += value;
                    }
                }
            }
        }

        return {
            totalRevenue,
            totalCosts,
            netProfit: totalRevenue - totalCosts,
            totalSubscribers,
            totalViews,
            totalActiveUsers
        };
    }

    async getProjectDetails(projectId: string): Promise<ProjectDetails | null> {
        const [projectRes, costsRes, revenueRes, metricsRes] = await Promise.all([
            queryNotionDb({
                database_id: process.env.NOTION_PROJECTS_DB_ID || ''
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
            const props = normalizeProps(projectPage.properties);
            project = parseProjectFromProps(projectPage.id, props);
        }

        let totalCosts = 0;
        for (const page of costsRes.results) {
            if (isPageObject(page)) {
                const props = normalizeProps(page.properties);
                if (props.amount?.number) totalCosts += props.amount.number;
            }
        }

        let totalRevenue = 0;
        for (const page of revenueRes.results) {
            if (isPageObject(page)) {
                const props = normalizeProps(page.properties);
                if (props.amount?.number) totalRevenue += props.amount.number;
            }
        }

        const metrics: Array<{ name: string; value: number }> = [];
        for (const page of metricsRes.results) {
            if (isPageObject(page)) {
                const props = normalizeProps(page.properties);
                const name = props.name?.title?.[0]?.plain_text || '';
                const value = props.value?.number || 0;
                if (name) metrics.push({ name, value });
            }
        }

        return { ...project, totalCosts, totalRevenue, netProfit: totalRevenue - totalCosts, metrics };
    }

    async getMultipleProjectDetails(ids: string[]): Promise<ProjectDetails[]> {
        if (ids.length === 0) return [];

        const [projectRes, costsRes, revenueRes, metricsRes] = await Promise.all([
            queryNotionDb({
                database_id: process.env.NOTION_PROJECTS_DB_ID || ''
            }),
            queryNotionDb({
                database_id: process.env.NOTION_COSTS_DB_ID || ''
            }),
            queryNotionDb({
                database_id: process.env.NOTION_REVENUE_DB_ID || ''
            }),
            queryNotionDb({
                database_id: process.env.NOTION_METRICS_DB_ID || ''
            })
        ]);

        const detailsList: ProjectDetails[] = [];

        for (const id of ids) {
            const projectPage = projectRes.results.find(p => p.id === id);
            if (!projectPage) continue;

            let project: Project = { id: '', name: '', type: '', status: '' };
            if (isPageObject(projectPage)) {
                const props = normalizeProps(projectPage.properties);
                project = parseProjectFromProps(projectPage.id, props);
            }

            const relatesToId = (page: PageObjectResponse | PartialPageObjectResponse | PartialDatabaseObjectResponse | DatabaseObjectResponse) => {
                if (isPageObject(page)) {
                    const props = normalizeProps(page.properties);
                    const relations = props.projects?.relation as Array<{ id: string }>;
                    return relations?.some(r => r.id === id) || false;
                }
                return false;
            };

            let totalCosts = 0;
            for (const page of costsRes.results) {
                if (relatesToId(page) && isPageObject(page)) {
                    const props = normalizeProps(page.properties);
                    if (props.amount?.number) totalCosts += props.amount.number;
                }
            }

            let totalRevenue = 0;
            for (const page of revenueRes.results) {
                if (relatesToId(page) && isPageObject(page)) {
                    const props = normalizeProps(page.properties);
                    if (props.amount?.number) totalRevenue += props.amount.number;
                }
            }

            const metrics: Array<{ name: string; value: number }> = [];
            for (const page of metricsRes.results) {
                if (relatesToId(page) && isPageObject(page)) {
                    const props = normalizeProps(page.properties);
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

    async getStreams(): Promise<StreamSummary[]> {
        const response = await queryNotionDb({
            database_id: process.env.NOTION_STREAMS_DB_ID || '',
            sorts: [{ property: 'actualStartTime', direction: 'descending' }],
        });

        const streams: StreamSummary[] = [];
        for (const page of response.results) {
            if (isPageObject(page)) {
                const props = normalizeProps(page.properties);
                const commitsJson = (props.commits?.rich_text || []).map(t => t.plain_text).join('');
                let commitCount = 0;
                const commitProjectIds: string[] = [];
                if (commitsJson) {
                    try {
                        const parsed = JSON.parse(commitsJson);
                        if (Array.isArray(parsed)) {
                            commitCount = parsed.length;
                            for (const c of parsed) {
                                if (c.projectId) commitProjectIds.push(c.projectId);
                            }
                        }
                    } catch { /* ignore parse errors */ }
                }

                const relationIds = props.projects?.relation?.map(r => r.id) || [];
                const mergedIds = [...new Set([...relationIds, ...commitProjectIds])];

                streams.push({
                    id: page.id,
                    name: props.name?.title?.[0]?.plain_text || '',
                    videoId: (props.videoid?.rich_text || []).map(t => t.plain_text).join(''),
                    actualStartTime: props.actualstarttime?.date?.start || '',
                    actualEndTime: props.actualendtime?.date?.start || '',
                    thumbnailUrl: props.thumbnailurl?.url || '',
                    viewCount: props.viewcount?.number || 0,
                    likeCount: props.likecount?.number || 0,
                    commentCount: props.commentcount?.number || 0,
                    duration: (props.duration?.rich_text || []).map(t => t.plain_text).join(''),
                    commitCount,
                    projectIds: mergedIds,
                });
            }
        }
        return streams;
    }

    async getStreamById(id: string): Promise<Stream | null> {
        const response = await queryNotionDb({
            database_id: process.env.NOTION_STREAMS_DB_ID || '',
        });

        const page = response.results.find(p => p.id === id);
        if (!page || !isPageObject(page)) return null;

        const props = normalizeProps(page.properties);
        const commitsJson = (props.commits?.rich_text || []).map(t => t.plain_text).join('');
        let commits: StreamCommit[] = [];
        if (commitsJson) {
            try {
                commits = JSON.parse(commitsJson);
            } catch { /* ignore parse errors */ }
        }

        return {
            id: page.id,
            name: props.name?.title?.[0]?.plain_text || '',
            videoId: (props.videoid?.rich_text || []).map(t => t.plain_text).join(''),
            actualStartTime: props.actualstarttime?.date?.start || '',
            actualEndTime: props.actualendtime?.date?.start || '',
            thumbnailUrl: props.thumbnailurl?.url || '',
            viewCount: props.viewcount?.number || 0,
            likeCount: props.likecount?.number || 0,
            commentCount: props.commentcount?.number || 0,
            duration: (props.duration?.rich_text || []).map(t => t.plain_text).join(''),
            commits,
            projectIds: props.projects?.relation?.map(r => r.id) || [],
        };
    }

    async getStreamCountForProject(projectId: string): Promise<number> {
        const response = await queryNotionDb({
            database_id: process.env.NOTION_STREAMS_DB_ID || '',
            filter: { property: 'projects', relation: { contains: projectId } },
        });
        return response.results.length;
    }
}
