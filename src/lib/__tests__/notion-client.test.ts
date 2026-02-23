import { NotionClient, notion } from '../notion-client';

jest.mock('@notionhq/client', () => {
    return {
        Client: jest.fn().mockImplementation(() => {
            return {
                dataSources: {
                    query: jest.fn(),
                },
            };
        }),
    };
});

const mockQuery = notion.dataSources.query as jest.Mock;

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
            });
            expect(mockQuery).toHaveBeenCalledWith({
                data_source_id: process.env.NOTION_PROJECTS_DB_ID || '',
                filter: { property: 'status', status: { equals: 'active' } },
            });
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
                            'metric name': { title: [{ plain_text: 'MRR' }] },
                            'value': { number: 50 }
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
            // First call: Project DB
            mockQuery.mockResolvedValueOnce({
                results: [
                    { id: 'p-1', properties: { name: { title: [{ plain_text: 'A' }] }, type: { select: { name: 't' } }, status: { select: { name: 'Active' } } } }
                ]
            });
            // Second call: Costs DB
            mockQuery.mockResolvedValueOnce({ results: [] });
            // Third call: Revenue DB
            mockQuery.mockResolvedValueOnce({ results: [] });
            // Fourth call: Metrics DB
            mockQuery.mockResolvedValueOnce({ results: [] });

            // Next batch for invalid ID (simulated by returning empty project DB)
            mockQuery.mockResolvedValueOnce({ results: [] });
            mockQuery.mockResolvedValueOnce({ results: [] });
            mockQuery.mockResolvedValueOnce({ results: [] });
            mockQuery.mockResolvedValueOnce({ results: [] });

            const results = await client.getMultipleProjectDetails(['p-1', 'invalid']);
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe('p-1');
            expect(results[0].name).toBe('A');
            expect(mockQuery).toHaveBeenCalledTimes(8); // 4 queries per project ID
        });
    });
});
