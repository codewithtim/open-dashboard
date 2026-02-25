import { DataClient, Project, DashboardStats, ProjectDetails } from './data-client';

const mockProjects: Project[] = [
    { id: 'youtube-main', name: 'Main YouTube Channel', type: 'Content', status: 'Active', platform: 'youtube' },
    { id: 'saas-starter', name: 'SaaS Boilerplate', type: 'Software', status: 'Active' },
    { id: 'consulting', name: 'Dev Consulting', type: 'Service', status: 'Active' },
    { id: 'failed-app', name: 'Old Crypto App', type: 'Software', status: 'Archived' },
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
        type: 'Content',
        status: 'Active',
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
        type: 'Software',
        status: 'Active',
        totalRevenue: 68000,
        totalCosts: 12000,
        netProfit: 56000,
        metrics: [
            { name: 'MRR', value: 8500 },
            { name: 'Active Users', value: 340 },
            { name: 'Churn Rate %', value: 2.1 }
        ]
    },
    'consulting': {
        id: 'consulting',
        name: 'Dev Consulting',
        type: 'Service',
        status: 'Active',
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
        return mockProjects.filter(p => p.status === 'Active');
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
