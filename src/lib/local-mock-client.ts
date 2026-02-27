import { DataClient, Project, DashboardStats, ProjectDetails } from './data-client';

const mockProjects: Project[] = [
    { id: 'youtube-main', name: 'Main YouTube Channel', type: 'content', status: 'active', platform: 'youtube' },
    { id: 'saas-starter', name: 'SaaS Boilerplate', type: 'software', status: 'active' },
    { id: 'npm-pkg', name: 'open-utils', type: 'package', status: 'active', platform: 'npm', platformAccountId: 'open-utils', link: 'https://www.npmjs.com/package/open-utils' },
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
        type: 'package',
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
}
