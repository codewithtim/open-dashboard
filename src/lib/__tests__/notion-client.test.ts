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

    describe('getStreams', () => {
        it('returns stream summaries with commit count parsed from JSON', async () => {
            const commits = [
                { sha: 'abc', message: 'feat', author: 'tim', timestamp: '2025-01-15T15:00:00Z', htmlUrl: '', repo: 'r', projectId: 'p' },
                { sha: 'def', message: 'fix', author: 'tim', timestamp: '2025-01-15T16:00:00Z', htmlUrl: '', repo: 'r', projectId: 'p' },
            ];

            mockQuery.mockResolvedValueOnce({
                results: [
                    {
                        id: 'stream-1',
                        properties: {
                            name: { title: [{ plain_text: 'Live Stream' }] },
                            videoId: { rich_text: [{ plain_text: 'vid1' }] },
                            actualStartTime: { date: { start: '2025-01-15T14:00:00Z' } },
                            actualEndTime: { date: { start: '2025-01-15T17:00:00Z' } },
                            thumbnailUrl: { url: 'https://thumb.jpg' },
                            viewCount: { number: 1000 },
                            likeCount: { number: 50 },
                            commentCount: { number: 10 },
                            duration: { rich_text: [{ plain_text: 'PT3H' }] },
                            commits: { rich_text: [{ plain_text: JSON.stringify(commits) }] },
                            projects: { relation: [{ id: 'yt-1' }] },
                        },
                    },
                ],
            });

            const streams = await client.getStreams();
            expect(streams).toHaveLength(1);
            expect(streams[0].commitCount).toBe(2);
            expect(streams[0].name).toBe('Live Stream');
            expect(streams[0].videoId).toBe('vid1');
            expect(streams[0].projectIds).toEqual(['yt-1']);
        });

        it('handles empty commits JSON gracefully', async () => {
            mockQuery.mockResolvedValueOnce({
                results: [
                    {
                        id: 'stream-2',
                        properties: {
                            name: { title: [{ plain_text: 'Empty Stream' }] },
                            videoId: { rich_text: [{ plain_text: 'vid2' }] },
                            actualStartTime: { date: { start: '2025-01-10T18:00:00Z' } },
                            actualEndTime: { date: { start: '2025-01-10T20:00:00Z' } },
                            thumbnailUrl: { url: null },
                            viewCount: { number: 0 },
                            likeCount: { number: 0 },
                            commentCount: { number: 0 },
                            duration: { rich_text: [] },
                            commits: { rich_text: [] },
                            projects: { relation: [] },
                        },
                    },
                ],
            });

            const streams = await client.getStreams();
            expect(streams).toHaveLength(1);
            expect(streams[0].commitCount).toBe(0);
        });
    });

    describe('getStreamById', () => {
        it('returns full stream with parsed commits', async () => {
            const commits = [{ sha: 'abc', message: 'feat', author: 'tim', timestamp: '2025-01-15T15:00:00Z', htmlUrl: '', repo: 'r', projectId: 'p' }];

            mockQuery.mockResolvedValueOnce({
                results: [
                    {
                        id: 'stream-1',
                        properties: {
                            name: { title: [{ plain_text: 'Live Stream' }] },
                            videoId: { rich_text: [{ plain_text: 'vid1' }] },
                            actualStartTime: { date: { start: '2025-01-15T14:00:00Z' } },
                            actualEndTime: { date: { start: '2025-01-15T17:00:00Z' } },
                            thumbnailUrl: { url: 'https://thumb.jpg' },
                            viewCount: { number: 1000 },
                            likeCount: { number: 50 },
                            commentCount: { number: 10 },
                            duration: { rich_text: [{ plain_text: 'PT3H' }] },
                            commits: { rich_text: [{ plain_text: JSON.stringify(commits) }] },
                            projects: { relation: [{ id: 'yt-1' }] },
                        },
                    },
                ],
            });

            const stream = await client.getStreamById('stream-1');
            expect(stream).not.toBeNull();
            expect(stream!.commits).toHaveLength(1);
            expect(stream!.commits[0].sha).toBe('abc');
        });

        it('returns null for non-existent stream', async () => {
            mockQuery.mockResolvedValueOnce({ results: [] });

            const stream = await client.getStreamById('nonexistent');
            expect(stream).toBeNull();
        });
    });

    describe('getStreamCountForProject', () => {
        it('returns count of streams for a project', async () => {
            mockQuery.mockResolvedValueOnce({
                results: [{ id: 's1' }, { id: 's2' }],
            });

            const count = await client.getStreamCountForProject('proj-1');
            expect(count).toBe(2);
            expect(mockQuery).toHaveBeenCalledWith({
                database_id: process.env.NOTION_STREAMS_DB_ID || '',
                filter: { property: 'projects', relation: { contains: 'proj-1' } },
            });
        });
    });
});
