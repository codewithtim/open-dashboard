import { DataClient, Project, DashboardStats, ProjectDetails, StreamSummary, Stream, StreamCommit } from './data-client';

const mockProjects: Project[] = [
    { id: 'youtube-main', name: 'Main YouTube Channel', type: 'content', status: 'active', platform: 'youtube' },
    { id: 'saas-starter', name: 'SaaS Boilerplate', type: 'software', status: 'active' },
    { id: 'npm-pkg', name: 'open-utils', type: 'software', status: 'active', platform: 'npm', platformAccountId: 'open-utils', link: 'https://www.npmjs.com/package/open-utils' },
    { id: 'consulting', name: 'Dev Consulting', type: 'service', status: 'active' },
    { id: 'failed-app', name: 'Old Crypto App', type: 'software', status: 'archived' },
];

const mockGlobalStats: DashboardStats = {
    totalRevenue: 125000,
    totalCosts: 18400,
    netProfit: 106600,
    totalSubscribers: 125000,
    totalViews: 850000,
    totalActiveUsers: 340
};

const mockProjectDetails: Record<string, ProjectDetails> = {
    'youtube-main': {
        id: 'youtube-main',
        name: 'Main YouTube Channel',
        type: 'content',
        status: 'active',
        totalRevenue: 45000,
        totalCosts: 5200,
        netProfit: 39800,
        metrics: [
            { name: 'Subscribers', value: 125000 },
            { name: 'Monthly Views', value: 850000 },
            { name: 'Avg Watch Time (min)', value: 8.5 }
        ]
    },
    'saas-starter': {
        id: 'saas-starter',
        name: 'SaaS Boilerplate',
        type: 'software',
        status: 'active',
        totalRevenue: 68000,
        totalCosts: 12000,
        netProfit: 56000,
        metrics: [
            { name: 'MRR', value: 8500 },
            { name: 'Active Users', value: 340 },
            { name: 'Churn Rate %', value: 2.1 }
        ]
    },
    'npm-pkg': {
        id: 'npm-pkg',
        name: 'open-utils',
        type: 'software',
        status: 'active',
        platform: 'npm',
        platformAccountId: 'open-utils',
        link: 'https://www.npmjs.com/package/open-utils',
        totalRevenue: 0,
        totalCosts: 5,
        netProfit: -5,
        metrics: [
            { name: 'Downloads', value: 48000 },
            { name: 'Weekly Downloads', value: 12500 }
        ]
    },
    'consulting': {
        id: 'consulting',
        name: 'Dev Consulting',
        type: 'service',
        status: 'active',
        totalRevenue: 12000,
        totalCosts: 1200,
        netProfit: 10800,
        metrics: [
            { name: 'Active Clients', value: 3 },
            { name: 'Billable Hours (MTD)', value: 85 }
        ]
    }
};

const mockStreamCommits: StreamCommit[] = [
    {
        sha: 'abc1234',
        message: 'feat: add user authentication',
        author: 'timknight',
        timestamp: '2025-01-15T14:30:00Z',
        htmlUrl: 'https://github.com/timknight/saas-starter/commit/abc1234',
        repo: 'timknight/saas-starter',
        projectId: 'saas-starter',
    },
    {
        sha: 'def5678',
        message: 'fix: resolve login redirect issue',
        author: 'timknight',
        timestamp: '2025-01-15T15:10:00Z',
        htmlUrl: 'https://github.com/timknight/saas-starter/commit/def5678',
        repo: 'timknight/saas-starter',
        projectId: 'saas-starter',
    },
    {
        sha: 'ghi9012',
        message: 'docs: update README with setup instructions',
        author: 'timknight',
        timestamp: '2025-01-15T15:45:00Z',
        htmlUrl: 'https://github.com/timknight/open-utils/commit/ghi9012',
        repo: 'timknight/open-utils',
        projectId: 'npm-pkg',
    },
];

const mockStreams: Stream[] = [
    {
        id: 'stream-1',
        name: 'Building Auth from Scratch - Live Coding',
        videoId: 'dQw4w9WgXcQ',
        actualStartTime: '2025-01-15T14:00:00Z',
        actualEndTime: '2025-01-15T17:00:00Z',
        thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        viewCount: 1250,
        likeCount: 89,
        commentCount: 34,
        duration: 'PT3H0M0S',
        commits: mockStreamCommits,
        projectIds: ['youtube-main'],
    },
    {
        id: 'stream-2',
        name: 'Setting Up CI/CD Pipeline',
        videoId: 'xvFZjo5PgG0',
        actualStartTime: '2025-01-10T18:00:00Z',
        actualEndTime: '2025-01-10T20:30:00Z',
        thumbnailUrl: 'https://i.ytimg.com/vi/xvFZjo5PgG0/maxresdefault.jpg',
        viewCount: 830,
        likeCount: 56,
        commentCount: 18,
        duration: 'PT2H30M0S',
        commits: [],
        projectIds: ['youtube-main'],
    },
];

export class LocalMockClient implements DataClient {
    async getProjects(): Promise<Project[]> {
        return mockProjects.filter(p => p.status === 'active');
    }

    async getAggregatedDashboardStats(): Promise<DashboardStats> {
        return mockGlobalStats;
    }

    async getProjectDetails(projectId: string): Promise<ProjectDetails | null> {
        return mockProjectDetails[projectId] || null;
    }

    async getMultipleProjectDetails(ids: string[]): Promise<ProjectDetails[]> {
        const details = await Promise.all(ids.map(id => this.getProjectDetails(id)));
        return details.filter((d): d is ProjectDetails => d !== null);
    }

    async getStreams(): Promise<StreamSummary[]> {
        return [...mockStreams]
            .sort((a, b) => new Date(b.actualStartTime).getTime() - new Date(a.actualStartTime).getTime())
            .map(({ commits, ...rest }) => {
                const commitProjectIds = commits.map(c => c.projectId).filter(Boolean);
                const mergedIds = [...new Set([...rest.projectIds, ...commitProjectIds])];
                return {
                    ...rest,
                    commitCount: commits.length,
                    projectIds: mergedIds,
                };
            });
    }

    async getStreamById(id: string): Promise<Stream | null> {
        return mockStreams.find(s => s.id === id) || null;
    }

    async getStreamCountForProject(projectId: string): Promise<number> {
        return mockStreams.filter(s =>
            s.commits.some(c => c.projectId === projectId) || s.projectIds.includes(projectId)
        ).length;
    }
}
