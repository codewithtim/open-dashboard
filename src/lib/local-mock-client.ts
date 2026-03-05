import { DataClient, Project, DashboardStats, ProjectDetails, StreamSummary, Stream, StreamCommit, ActivityEvent } from './data-client';

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

const mockActivityEvents: ActivityEvent[] = [
    {
        id: 'activity-1',
        type: 'tweet',
        timestamp: '2025-01-16T09:15:00Z',
        externalId: 'tweet:100001',
        payload: {
            text: 'Morning grind. Shipped dark mode for the dashboard overnight, now tackling the activity feed. Building in public means showing the messy parts too.',
            likeCount: 87,
            retweetCount: 14,
            replyCount: 9,
        },
    },
    {
        id: 'activity-2',
        type: 'commit',
        timestamp: '2025-01-16T08:42:00Z',
        projectId: 'saas-starter',
        projectName: 'SaaS Boilerplate',
        externalId: 'commit:f4a2e91',
        payload: {
            sha: 'f4a2e91',
            message: 'feat: add activity feed component with relative timestamps',
            author: 'timknight',
            htmlUrl: 'https://github.com/timknight/saas-starter/commit/f4a2e91',
            repo: 'timknight/saas-starter',
        },
    },
    {
        id: 'activity-3',
        type: 'commit',
        timestamp: '2025-01-16T08:20:00Z',
        projectId: 'saas-starter',
        projectName: 'SaaS Boilerplate',
        externalId: 'commit:b7c3d82',
        payload: {
            sha: 'b7c3d82',
            message: 'refactor: extract DataClient interface for activity events',
            author: 'timknight',
            htmlUrl: 'https://github.com/timknight/saas-starter/commit/b7c3d82',
            repo: 'timknight/saas-starter',
        },
    },
    {
        id: 'activity-4',
        type: 'commit',
        timestamp: '2025-01-16T07:55:00Z',
        projectId: 'npm-pkg',
        projectName: 'open-utils',
        externalId: 'commit:c9e1f03',
        payload: {
            sha: 'c9e1f03',
            message: 'fix: handle edge case in date formatting for empty strings',
            author: 'timknight',
            htmlUrl: 'https://github.com/timknight/open-utils/commit/c9e1f03',
            repo: 'timknight/open-utils',
        },
    },
    {
        id: 'activity-5',
        type: 'stream_end',
        timestamp: '2025-01-15T22:30:00Z',
        projectId: 'youtube-main',
        projectName: 'Main YouTube Channel',
        externalId: 'stream_end:dQw4w9WgXcQ',
        payload: {
            streamName: 'Building Auth from Scratch - Live Coding',
            videoId: 'dQw4w9WgXcQ',
            viewCount: 1250,
            duration: 'PT3H0M0S',
        },
    },
    {
        id: 'activity-6',
        type: 'tweet',
        timestamp: '2025-01-15T22:35:00Z',
        externalId: 'tweet:100002',
        payload: {
            text: 'Stream recap: 3 hours of live coding, shipped a full auth system from scratch. JWT + refresh tokens + middleware. VOD going up tomorrow.',
            likeCount: 142,
            retweetCount: 23,
            replyCount: 18,
        },
    },
    {
        id: 'activity-7',
        type: 'commit',
        timestamp: '2025-01-15T21:45:00Z',
        projectId: 'saas-starter',
        projectName: 'SaaS Boilerplate',
        externalId: 'commit:def5678',
        payload: {
            sha: 'def5678',
            message: 'fix: resolve login redirect issue after token refresh',
            author: 'timknight',
            htmlUrl: 'https://github.com/timknight/saas-starter/commit/def5678',
            repo: 'timknight/saas-starter',
        },
    },
    {
        id: 'activity-8',
        type: 'commit',
        timestamp: '2025-01-15T21:10:00Z',
        projectId: 'saas-starter',
        projectName: 'SaaS Boilerplate',
        externalId: 'commit:abc1234',
        payload: {
            sha: 'abc1234',
            message: 'feat: add JWT authentication with refresh token rotation',
            author: 'timknight',
            htmlUrl: 'https://github.com/timknight/saas-starter/commit/abc1234',
            repo: 'timknight/saas-starter',
        },
    },
    {
        id: 'activity-9',
        type: 'commit',
        timestamp: '2025-01-15T20:30:00Z',
        projectId: 'saas-starter',
        projectName: 'SaaS Boilerplate',
        externalId: 'commit:e5d4c3b',
        payload: {
            sha: 'e5d4c3b',
            message: 'feat: add auth middleware for protected API routes',
            author: 'timknight',
            htmlUrl: 'https://github.com/timknight/saas-starter/commit/e5d4c3b',
            repo: 'timknight/saas-starter',
        },
    },
    {
        id: 'activity-10',
        type: 'stream_start',
        timestamp: '2025-01-15T19:30:00Z',
        projectId: 'youtube-main',
        projectName: 'Main YouTube Channel',
        externalId: 'stream_start:dQw4w9WgXcQ',
        payload: {
            streamName: 'Building Auth from Scratch - Live Coding',
            videoId: 'dQw4w9WgXcQ',
        },
    },
    {
        id: 'activity-11',
        type: 'tweet',
        timestamp: '2025-01-15T19:25:00Z',
        externalId: 'tweet:100003',
        payload: {
            text: 'Going live in 5 minutes! Building a complete auth system from scratch — JWT, refresh tokens, the whole thing. Come hang out.',
            likeCount: 56,
            retweetCount: 11,
            replyCount: 7,
        },
    },
    {
        id: 'activity-12',
        type: 'commit',
        timestamp: '2025-01-15T16:00:00Z',
        projectId: 'npm-pkg',
        projectName: 'open-utils',
        externalId: 'commit:ghi9012',
        payload: {
            sha: 'ghi9012',
            message: 'docs: update README with setup instructions and examples',
            author: 'timknight',
            htmlUrl: 'https://github.com/timknight/open-utils/commit/ghi9012',
            repo: 'timknight/open-utils',
        },
    },
    {
        id: 'activity-13',
        type: 'commit',
        timestamp: '2025-01-15T15:20:00Z',
        projectId: 'npm-pkg',
        projectName: 'open-utils',
        externalId: 'commit:a1b2c3d',
        payload: {
            sha: 'a1b2c3d',
            message: 'feat: add formatCurrency and formatNumber utility functions',
            author: 'timknight',
            htmlUrl: 'https://github.com/timknight/open-utils/commit/a1b2c3d',
            repo: 'timknight/open-utils',
        },
    },
    {
        id: 'activity-14',
        type: 'tweet',
        timestamp: '2025-01-15T12:00:00Z',
        externalId: 'tweet:100004',
        payload: {
            text: 'open-utils just hit 48k downloads on npm. Started as a helper lib for my own projects — wild to see other people actually using it.',
            likeCount: 203,
            retweetCount: 31,
            replyCount: 22,
        },
    },
    {
        id: 'activity-15',
        type: 'commit',
        timestamp: '2025-01-15T10:30:00Z',
        projectId: 'saas-starter',
        projectName: 'SaaS Boilerplate',
        externalId: 'commit:9f8e7d6',
        payload: {
            sha: '9f8e7d6',
            message: 'chore: upgrade Next.js to 16.1 and update dependencies',
            author: 'timknight',
            htmlUrl: 'https://github.com/timknight/saas-starter/commit/9f8e7d6',
            repo: 'timknight/saas-starter',
        },
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

    async getAllProjects(): Promise<Project[]> {
        return mockProjects;
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

    async getRecentActivity(limit: number = 20): Promise<ActivityEvent[]> {
        return [...mockActivityEvents]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);
    }
}
