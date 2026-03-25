import { DataClient, Project, DashboardStats, ProjectDetails, StreamSummary, Stream, StreamCommit, ActivityEvent, Company, Agent, AgentCommit, AgentActivity, Expense, ExpenseSummary, ProjectService, CreateExpenseInput, CostAllocation } from './data-client';

const mockProjects: Project[] = [
    { id: 'youtube-main', name: 'Main YouTube Channel', description: 'Live coding streams and tech tutorials on YouTube.', type: 'content', status: 'active', platform: 'youtube' },
    { id: 'saas-starter', name: 'SaaS Boilerplate', description: 'A production-ready Next.js SaaS starter kit with auth, billing, and dashboards.', type: 'software', status: 'active' },
    { id: 'npm-pkg', name: 'open-utils', description: 'A lightweight utility library for common JavaScript operations.', type: 'software', status: 'active', platform: 'npm', platformAccountId: 'open-utils', link: 'https://www.npmjs.com/package/open-utils' },
    { id: 'consulting', name: 'Dev Consulting', description: 'Freelance development consulting for startups and small teams.', type: 'service', status: 'active' },
    { id: 'failed-app', name: 'Old Crypto App', description: 'A crypto portfolio tracker that was retired in 2024.', type: 'software', status: 'archived' },
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
        description: 'Live coding streams and tech tutorials on YouTube.',
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
        description: 'A production-ready Next.js SaaS starter kit with auth, billing, and dashboards.',
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
        description: 'A lightweight utility library for common JavaScript operations.',
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
        description: 'Freelance development consulting for startups and small teams.',
        type: 'service',
        status: 'active',
        totalRevenue: 12000,
        totalCosts: 1200,
        netProfit: 10800,
        metrics: [
            { name: 'Active Clients', value: 3 },
            { name: 'Billable Hours (MTD)', value: 85 }
        ]
    },
    'failed-app': {
        id: 'failed-app',
        name: 'Old Crypto App',
        description: 'A crypto portfolio tracker that was retired in 2024.',
        type: 'software',
        status: 'archived',
        totalRevenue: 0,
        totalCosts: 2400,
        netProfit: -2400,
        metrics: []
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

const mockCompanies: Company[] = [
    {
        id: 'comp_openai',
        name: 'OpenAI',
        slug: 'openai',
        website: 'https://openai.com',
        description: 'AI research and deployment company',
        createdAt: '2025-01-01T00:00:00Z',
    },
];

const mockAgents: Agent[] = [
    {
        id: 'agent-operator',
        name: 'Operator',
        identifier: 'Operator',
        description: 'OpenClaw autonomous coding agent',
        companyId: 'comp_openai',
        companyName: 'OpenAI',
        model: 'gpt-4o',
        status: 'idle',
        createdAt: '2025-01-01T00:00:00Z',
    },
];

const mockAgentCommits: AgentCommit[] = [
    {
        id: 1,
        agentId: 'agent-operator',
        repoFullName: 'codewithtim/insider_trading_tracker',
        sha: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
        message: 'feat: add SEC Form 4 filing parser for real-time insider trade detection',
        author: 'Operator',
        timestamp: '2025-01-16T06:30:00Z',
        htmlUrl: 'https://github.com/codewithtim/insider_trading_tracker/commit/a1b2c3d',
        agentName: 'Operator',
    },
    {
        id: 2,
        agentId: 'agent-operator',
        repoFullName: 'codewithtim/insider_trading_tracker',
        sha: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1',
        message: 'fix: handle edge case in filing date parsing for amended filings',
        author: 'Operator',
        timestamp: '2025-01-16T04:15:00Z',
        htmlUrl: 'https://github.com/codewithtim/insider_trading_tracker/commit/b2c3d4e',
        agentName: 'Operator',
    },
    {
        id: 3,
        agentId: 'agent-operator',
        repoFullName: 'codewithtim/insider_trading_tracker',
        sha: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
        message: 'feat: add notification system for large insider transactions over $1M',
        author: 'Operator',
        timestamp: '2025-01-15T22:00:00Z',
        htmlUrl: 'https://github.com/codewithtim/insider_trading_tracker/commit/c3d4e5f',
        agentName: 'Operator',
    },
];

const mockAgentActivities: AgentActivity[] = [
    {
        id: 1,
        agentId: 'agent-operator',
        action: 'orchestrator_run',
        description: 'Started scheduled orchestrator run for insider_trading_tracker',
        timestamp: '2025-01-16T06:25:00Z',
        agentName: 'Operator',
    },
    {
        id: 2,
        agentId: 'agent-operator',
        action: 'code_review',
        description: 'Reviewed PR #42: SEC filing parser improvements',
        timestamp: '2025-01-16T05:00:00Z',
        agentName: 'Operator',
    },
    {
        id: 3,
        agentId: 'agent-operator',
        action: 'orchestrator_run',
        description: 'Completed nightly dependency audit — no vulnerabilities found',
        timestamp: '2025-01-15T20:00:00Z',
        agentName: 'Operator',
    },
];

const mockExpenses: Expense[] = [
    {
        id: 'exp-1',
        amount: 20,
        vendor: 'Vercel',
        category: 'infrastructure',
        note: 'Pro plan hosting',
        date: '2025-01-01',
        source: 'manual',
        recurring: true,
        currency: 'USD',
        createdAt: '2025-01-01T00:00:00Z',
        allocations: [{ projectId: 'saas-starter', allocation: 1 }],
    },
    {
        id: 'exp-2',
        amount: 4,
        vendor: 'GitHub',
        category: 'tooling',
        note: 'Team plan',
        date: '2025-01-01',
        source: 'manual',
        recurring: true,
        currency: 'USD',
        createdAt: '2025-01-01T00:00:00Z',
        allocations: [
            { projectId: 'saas-starter', allocation: 0.5 },
            { projectId: 'npm-pkg', allocation: 0.5 },
        ],
    },
    {
        id: 'exp-3',
        amount: 20,
        vendor: 'Claude Code',
        category: 'tooling',
        note: 'Max plan subscription',
        date: '2025-01-01',
        source: 'manual',
        recurring: true,
        currency: 'USD',
        createdAt: '2025-01-01T00:00:00Z',
        allocations: [
            { projectId: 'saas-starter', allocation: 0.25 },
            { projectId: 'npm-pkg', allocation: 0.25 },
            { projectId: 'youtube-main', allocation: 0.25 },
            { projectId: 'consulting', allocation: 0.25 },
        ],
    },
    {
        id: 'exp-4',
        amount: 150,
        vendor: 'Office Supplies',
        category: 'other',
        date: '2025-02-15',
        source: 'manual',
        recurring: false,
        currency: 'USD',
        createdAt: '2025-02-15T00:00:00Z',
        allocations: [],
    },
];

const mockProjectServicesList: ProjectService[] = [
    { id: 'ps-1', projectId: 'saas-starter', vendor: 'Vercel', exclusive: true },
    { id: 'ps-2', projectId: 'saas-starter', vendor: 'GitHub', exclusive: false },
    { id: 'ps-3', projectId: 'npm-pkg', vendor: 'GitHub', exclusive: false },
    { id: 'ps-4', projectId: 'youtube-main', vendor: 'Claude Code', exclusive: false },
    { id: 'ps-5', projectId: 'consulting', vendor: 'Claude Code', exclusive: false },
];

export class LocalMockClient implements DataClient {
    private expenses: Expense[] = [...mockExpenses.map(e => ({ ...e, allocations: [...e.allocations] }))];
    private projectServicesList: ProjectService[] = [...mockProjectServicesList.map(s => ({ ...s }))];

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

    async getCompanies(): Promise<Company[]> {
        return mockCompanies;
    }

    async getAgents(): Promise<Agent[]> {
        return mockAgents;
    }

    async getAgentCommits(limit: number = 50): Promise<AgentCommit[]> {
        return [...mockAgentCommits]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);
    }

    async getAgentActivities(limit: number = 50): Promise<AgentActivity[]> {
        return [...mockAgentActivities]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);
    }

    async getExpenses(): Promise<Expense[]> {
        return [...this.expenses.map(e => ({ ...e, allocations: [...e.allocations] }))];
    }

    async getExpensesByProject(projectId: string): Promise<Expense[]> {
        return this.expenses
            .filter(e => e.allocations.some(a => a.projectId === projectId))
            .map(e => ({ ...e, allocations: [...e.allocations] }));
    }

    async createExpense(input: CreateExpenseInput, allocations: CostAllocation[]): Promise<Expense> {
        const expense: Expense = {
            id: crypto.randomUUID(),
            amount: input.amount,
            vendor: input.vendor,
            category: input.category,
            note: input.note,
            date: input.date,
            periodStart: input.periodStart,
            periodEnd: input.periodEnd,
            source: input.source ?? 'manual',
            sourceRef: input.sourceRef,
            recurring: input.recurring ?? false,
            currency: input.currency ?? 'USD',
            createdAt: new Date().toISOString(),
            allocations: [...allocations],
        };
        this.expenses.push(expense);
        return { ...expense, allocations: [...allocations] };
    }

    async getExpenseSummary(): Promise<ExpenseSummary> {
        const byCategory: Record<string, number> = {};
        const byVendor: Record<string, number> = {};
        let totalAmount = 0;

        for (const e of this.expenses) {
            totalAmount += e.amount;
            byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
            byVendor[e.vendor] = (byVendor[e.vendor] ?? 0) + e.amount;
        }

        return { totalAmount, count: this.expenses.length, byCategory, byVendor };
    }

    async getProjectServices(projectId: string): Promise<ProjectService[]> {
        return this.projectServicesList
            .filter(s => s.projectId === projectId)
            .map(s => ({ ...s }));
    }

    async getAllProjectServices(): Promise<ProjectService[]> {
        return [...this.projectServicesList.map(s => ({ ...s }))];
    }

    async updateProjectServices(projectId: string, services: { vendor: string; exclusive: boolean }[]): Promise<void> {
        this.projectServicesList = this.projectServicesList.filter(s => s.projectId !== projectId);
        for (const svc of services) {
            this.projectServicesList.push({
                id: crypto.randomUUID(),
                projectId,
                vendor: svc.vendor,
                exclusive: svc.exclusive,
            });
        }
    }
}
