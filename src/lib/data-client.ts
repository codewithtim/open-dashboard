export interface Project {
    id: string;
    name: string;
    type: string;
    status: string;
    platform?: string;
    platformAccountId?: string;
    link?: string;
}

export interface Metric {
    name: string;
    value: number;
}

export interface ProjectDetails extends Project {
    totalCosts: number;
    totalRevenue: number;
    netProfit: number;
    metrics: Metric[];
}

export interface Tool {
    id: string;
    name: string;
    slug: string;
    category: string;
    description: string;
    iconKey: string;
    recommended: boolean;
    referralUrl?: string;
    projectIds: string[];
}

export interface DashboardStats {
    totalRevenue: number;
    totalCosts: number;
    netProfit: number;
    totalSubscribers: number;
    totalViews: number;
    totalActiveUsers: number;
}

export interface DataClient {
    getProjects(): Promise<Project[]>;
    getAggregatedDashboardStats(): Promise<DashboardStats>;
    getProjectDetails(projectId: string): Promise<ProjectDetails | null>;
    getMultipleProjectDetails(ids: string[]): Promise<ProjectDetails[]>;
    getTools(): Promise<Tool[]>;
    getToolBySlug(slug: string): Promise<Tool | null>;
}
