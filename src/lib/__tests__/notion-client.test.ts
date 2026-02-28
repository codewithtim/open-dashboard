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
                type: 'software',
                status: 'active',
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
        it('returns total revenue, costs, profit, and aggregated social stats for active projects only', async () => {
            mockQuery
                // 1. Mock Projects DB (1 Active, 1 Inactive just to test filtering conceptually, though query might filter natively)
                .mockResolvedValueOnce({
                    results: [
                        { id: 'active-1', properties: {} },
                    ]
                })
                // 2. Mock Revenue DB
                .mockResolvedValueOnce({
                    results: [
                        { properties: { amount: { number: 100 } } },
                        { properties: { amount: { number: 200 } } },
                    ]
                })
                // 3. Mock Costs DB
                .mockResolvedValueOnce({
                    results: [
                        { properties: { amount: { number: 50 } } },
                    ]
                })
                // 4. Mock Metrics DB
                .mockResolvedValueOnce({
                    results: [
                        {
                            properties: {
                                name: { title: [{ plain_text: 'Subscribers' }] },
                                value: { number: 1500 },
                                projects: { relation: [{ id: 'active-1' }] }
                            }
                        },
                        {
                            properties: {
                                name: { title: [{ plain_text: 'Active Users' }] },
                                value: { number: 300 },
                                projects: { relation: [{ id: 'active-1' }] }
                            }
                        },
                        {
                            properties: {
                                name: { title: [{ plain_text: 'Views' }] },
                                value: { number: 5000 },
                                projects: { relation: [{ id: 'active-1' }] }
                            }
                        },
                        {
                            properties: {
                                name: { title: [{ plain_text: 'Twitter Followers' }] },
                                value: { number: 1200 },
                                projects: { relation: [{ id: 'active-1' }] }
                            }
                        },
                        {
                            properties: {
                                name: { title: [{ plain_text: 'TikTok Followers' }] },
                                value: { number: 3400 },
                                projects: { relation: [{ id: 'active-1' }] }
                            }
                        },
                        {
                            properties: {
                                name: { title: [{ plain_text: 'Twitch Followers' }] },
                                value: { number: 800 },
                                projects: { relation: [{ id: 'active-1' }] }
                            }
                        },
                        {
                            properties: {
                                name: { title: [{ plain_text: 'Subscribers' }] },
                                value: { number: 100 },
                                projects: { relation: [{ id: 'inactive-99' }] } // Should be ignored
                            }
                        },
                    ]
                });

            const stats = await client.getAggregatedDashboardStats();
            expect(stats.totalRevenue).toBe(300);
            expect(stats.totalCosts).toBe(50);
            expect(stats.netProfit).toBe(250);
            expect(stats.totalSubscribers).toBe(1500 + 1200 + 3400 + 800); // 1500 + Twitter + TikTok + Twitch
            expect(stats.totalViews).toBe(5000);
            expect(stats.totalActiveUsers).toBe(300);
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

    describe('getTools', () => {
        beforeEach(() => {
            process.env.NOTION_TOOLS_DB_ID = 'test-tools-db';
        });
        afterEach(() => {
            delete process.env.NOTION_TOOLS_DB_ID;
        });

        it('returns empty array when NOTION_TOOLS_DB_ID is not set', async () => {
            delete process.env.NOTION_TOOLS_DB_ID;
            const tools = await client.getTools();
            expect(tools).toEqual([]);
            expect(mockQuery).not.toHaveBeenCalled();
        });

        it('returns mapped tools from Notion database', async () => {
            mockQuery.mockResolvedValueOnce({
                results: [
                    {
                        id: 'tool-1',
                        properties: {
                            name: { title: [{ plain_text: 'Vercel' }] },
                            slug: { rich_text: [{ plain_text: 'vercel' }] },
                            category: { select: { name: 'hosting' } },
                            description: { rich_text: [{ plain_text: 'Cloud platform' }] },
                            icon_key: { rich_text: [{ plain_text: 'SiVercel' }] },
                            recommended: { checkbox: true },
                            referral_url: { url: 'https://vercel.com' },
                            projects: { relation: [{ id: 'p-1' }, { id: 'p-2' }] },
                        },
                    },
                ],
            });

            const tools = await client.getTools();
            expect(tools).toHaveLength(1);
            expect(tools[0]).toEqual({
                id: 'tool-1',
                name: 'Vercel',
                slug: 'vercel',
                category: 'hosting',
                description: 'Cloud platform',
                iconKey: 'SiVercel',
                recommended: true,
                referralUrl: 'https://vercel.com',
                projectIds: ['p-1', 'p-2'],
            });
        });

        it('handles missing optional fields gracefully', async () => {
            mockQuery.mockResolvedValueOnce({
                results: [
                    {
                        id: 'tool-2',
                        properties: {
                            name: { title: [{ plain_text: 'Tailwind' }] },
                            slug: { rich_text: [{ plain_text: 'tailwind' }] },
                            category: { select: { name: 'styling' } },
                            description: { rich_text: [] },
                            icon_key: { rich_text: [{ plain_text: 'SiTailwindcss' }] },
                            recommended: { checkbox: false },
                        },
                    },
                ],
            });

            const tools = await client.getTools();
            expect(tools[0].description).toBe('');
            expect(tools[0].referralUrl).toBeUndefined();
            expect(tools[0].projectIds).toEqual([]);
        });
    });

    describe('getToolBySlug', () => {
        beforeEach(() => {
            process.env.NOTION_TOOLS_DB_ID = 'test-tools-db';
        });
        afterEach(() => {
            delete process.env.NOTION_TOOLS_DB_ID;
        });

        it('returns tool matching slug', async () => {
            mockQuery.mockResolvedValueOnce({
                results: [
                    {
                        id: 'tool-1',
                        properties: {
                            name: { title: [{ plain_text: 'Vercel' }] },
                            slug: { rich_text: [{ plain_text: 'vercel' }] },
                            category: { select: { name: 'hosting' } },
                            description: { rich_text: [{ plain_text: 'Cloud' }] },
                            icon_key: { rich_text: [{ plain_text: 'SiVercel' }] },
                            recommended: { checkbox: true },
                            referral_url: { url: 'https://vercel.com' },
                            projects: { relation: [] },
                        },
                    },
                ],
            });

            const tool = await client.getToolBySlug('vercel');
            expect(tool).not.toBeNull();
            expect(tool!.name).toBe('Vercel');
        });

        it('returns null for non-existent slug', async () => {
            mockQuery.mockResolvedValueOnce({ results: [] });
            const tool = await client.getToolBySlug('nonexistent');
            expect(tool).toBeNull();
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
