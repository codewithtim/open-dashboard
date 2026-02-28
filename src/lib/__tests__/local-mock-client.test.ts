import { LocalMockClient } from '../local-mock-client';

describe('LocalMockClient', () => {
    let client: LocalMockClient;

    beforeEach(() => {
        client = new LocalMockClient();
    });

    describe('getProjects', () => {
        it('returns only active projects', async () => {
            const projects = await client.getProjects();
            expect(projects.length).toBeGreaterThan(0);
            projects.forEach(p => expect(p.status).toBe('active'));
        });

        it('includes platform on projects that have one', async () => {
            const projects = await client.getProjects();
            const youtube = projects.find(p => p.name === 'Main YouTube Channel');
            expect(youtube).toBeDefined();
            expect(youtube!.platform).toBe('youtube');
        });

        it('includes npm platform on npm projects', async () => {
            const projects = await client.getProjects();
            const npm = projects.find(p => p.name === 'open-utils');
            expect(npm).toBeDefined();
            expect(npm!.platform).toBe('npm');
        });

        it('has undefined platform on projects without one', async () => {
            const projects = await client.getProjects();
            const consulting = projects.find(p => p.name === 'Dev Consulting');
            expect(consulting).toBeDefined();
            expect(consulting!.platform).toBeUndefined();
        });
    });

    describe('getAggregatedDashboardStats', () => {
        it('returns predefined dashboard stats', async () => {
            const stats = await client.getAggregatedDashboardStats();
            expect(stats.totalRevenue).toBe(125000);
            expect(stats.totalCosts).toBe(18400);
            expect(stats.netProfit).toBe(106600);
        });
    });

    describe('getProjectDetails', () => {
        it('returns details for an existing project', async () => {
            const details = await client.getProjectDetails('saas-starter');
            expect(details).not.toBeNull();
            expect(details!.id).toBe('saas-starter');
            expect(details!.metrics.length).toBeGreaterThan(0);
        });

        it('returns null for a non-existent project', async () => {
            const details = await client.getProjectDetails('invalid-id');
            expect(details).toBeNull();
        });
    });

    describe('getMultipleProjectDetails', () => {
        it('returns available project details and filters out nulls', async () => {
            const details = await client.getMultipleProjectDetails(['saas-starter', 'invalid', 'youtube-main']);
            expect(details).toHaveLength(2);
            expect(details[0].id).toBe('saas-starter');
            expect(details[1].id).toBe('youtube-main');
        });

        it('returns an empty array if all ids are invalid', async () => {
            const details = await client.getMultipleProjectDetails(['nope', 'nah']);
            expect(details).toHaveLength(0);
        });
    });

    describe('getStreams', () => {
        it('returns stream summaries with commit counts', async () => {
            const streams = await client.getStreams();
            expect(streams.length).toBeGreaterThan(0);
            streams.forEach(s => {
                expect(s).toHaveProperty('id');
                expect(s).toHaveProperty('name');
                expect(s).toHaveProperty('commitCount');
                expect(s).not.toHaveProperty('commits');
            });
        });
    });

    describe('getStreamById', () => {
        it('returns a stream with full commit details', async () => {
            const stream = await client.getStreamById('stream-1');
            expect(stream).not.toBeNull();
            expect(stream!.name).toBe('Building Auth from Scratch - Live Coding');
            expect(stream!.commits.length).toBeGreaterThan(0);
            expect(stream!.commits[0]).toHaveProperty('sha');
            expect(stream!.commits[0]).toHaveProperty('repo');
        });

        it('returns null for non-existent stream', async () => {
            const stream = await client.getStreamById('nonexistent');
            expect(stream).toBeNull();
        });
    });

    describe('getStreamCountForProject', () => {
        it('returns count of streams related to a project', async () => {
            const count = await client.getStreamCountForProject('youtube-main');
            expect(count).toBeGreaterThan(0);
        });

        it('returns 0 for a project with no streams', async () => {
            const count = await client.getStreamCountForProject('nonexistent-project');
            expect(count).toBe(0);
        });
    });
});
