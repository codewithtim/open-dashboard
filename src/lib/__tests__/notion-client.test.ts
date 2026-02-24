import { NotionClient, notion } from '../notion-client';

jest.mock('@notionhq/client', () => {
    return {
        Client: jest.fn().mockImplementation(() => {
            return {
                databases: {
                    query: jest.fn(),
                },
            };
        }),
    };
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockQuery = (notion.databases as any).query as jest.Mock;

describe('NotionClient', () => {
    let client: NotionClient;

    beforeEach(() => {
        client = new NotionClient();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getProjects', () => {
        it('returns a mapped array of active projects', async () => {
            mockQuery.mockResolvedValueOnce({
                results: [
                    {
                        id: 'proj-1',
                        properties: {
                            name: { title: [{ plain_text: 'Project 1' }] },
                            type: { select: { name: 'Software' } },
                            status: { select: { name: 'Active' } },
                            platform: { select: { name: 'youtube' } },
                            'Platform Account ID': { rich_text: [{ plain_text: 'UC123ABC' }] }
                        }
                    }
                ]
            });

            const projects = await client.getProjects();
            expect(projects).toHaveLength(1);
            expect(projects[0]).toEqual({
                id: 'proj-1',
                name: 'Project 1',
                type: 'Software',
                status: 'Active',
                platform: 'youtube',
                platformAccountId: 'UC123ABC',
                link: 'https://youtube.com/channel/UC123ABC'
            });
            expect(mockQuery).toHaveBeenCalledWith({
                database_id: process.env.NOTION_PROJECTS_DB_ID || '',
                filter: { property: 'status', select: { equals: 'active' } },
            });
        });

        it('returns undefined platform when not set', async () => {
            mockQuery.mockResolvedValueOnce({
                results: [
                    {
                        id: 'proj-2',
                        properties: {
                            name: { title: [{ plain_text: 'No Platform' }] },
                            type: { select: { name: 'Service' } },
                            status: { select: { name: 'Active' } },
                        }
                    }
                ]
            });

            const projects = await client.getProjects();
            expect(projects[0].platform).toBeUndefined();
        });
    });

    describe('getAggregatedDashboardStats', () => {
        it('returns total revenue, costs, and profit', async () => {
            mockQuery
                .mockResolvedValueOnce({
                    results: [
                        { properties: { amount: { number: 100 } } },
                        { properties: { amount: { number: 200 } } },
                    ]
                })
                .mockResolvedValueOnce({
                    results: [
                        { properties: { amount: { number: 50 } } },
                    ]
                });

            const stats = await client.getAggregatedDashboardStats();
            expect(stats.totalRevenue).toBe(300);
            expect(stats.totalCosts).toBe(50);
            expect(stats.netProfit).toBe(250);
        });
    });

    describe('getProjectDetails', () => {
        it('returns project details with specific stats and metrics', async () => {
            mockQuery
                .mockResolvedValueOnce({
                    results: [
                        {
                            id: 'p-1',
                            properties: {
                                name: { title: [{ plain_text: 'App' }] },
                            }
                        }
                    ]
                })
                .mockResolvedValueOnce({
                    results: [{ properties: { amount: { number: 20 } } }] // Costs
                })
                .mockResolvedValueOnce({
                    results: [{ properties: { amount: { number: 100 } } }] // Revenue
                })
                .mockResolvedValueOnce({
                    results: [{
                        properties: {
                            name: { title: [{ plain_text: 'MRR' }] },
                            value: { number: 50 }
                        }
                    }] // Metrics
                });

            const details = await client.getProjectDetails('p-1');
            expect(details).not.toBeNull();
            expect(details!.id).toBe('p-1');
            expect(details!.name).toBe('App');
            expect(details!.totalRevenue).toBe(100);
            expect(details!.totalCosts).toBe(20);
            expect(details!.netProfit).toBe(80);
            expect(details!.metrics).toHaveLength(1);
            expect(details!.metrics[0].name).toBe('MRR');
        });
    });

    describe('getMultipleProjectDetails', () => {
        it('fetches multiple project details and filters missing ones', async () => {
            // Bulk call 1: Project DB
            mockQuery.mockResolvedValueOnce({
                results: [
                    { id: 'p-1', properties: { name: { title: [{ plain_text: 'A' }] }, type: { select: { name: 't' } }, status: { select: { name: 'Active' } } } }
                ]
            });
            // Bulk call 2: Costs DB (Empty)
            mockQuery.mockResolvedValueOnce({ results: [] });
            // Bulk call 3: Revenue DB (Empty)
            mockQuery.mockResolvedValueOnce({ results: [] });
            // Bulk call 4: Metrics DB (Empty)
            mockQuery.mockResolvedValueOnce({ results: [] });

            const results = await client.getMultipleProjectDetails(['p-1', 'invalid']);
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe('p-1');
            expect(results[0].name).toBe('A');
            // Since it is an O(1) bulk fetch now, it should exactly be 4 combined queries
            expect(mockQuery).toHaveBeenCalledTimes(4);
        });
    });
});
