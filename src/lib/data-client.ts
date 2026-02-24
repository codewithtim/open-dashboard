export interface Project {
    id: string;
    name: string;
    type: string;
    status: string;
    platform?: string;
    platformAccountId?: string;
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

export interface DashboardStats {
    totalRevenue: number;
    totalCosts: number;
    netProfit: number;
}

export interface DataClient {
    getProjects(): Promise<Project[]>;
    getAggregatedDashboardStats(): Promise<DashboardStats>;
    getProjectDetails(projectId: string): Promise<ProjectDetails | null>;
    getMultipleProjectDetails(ids: string[]): Promise<ProjectDetails[]>;
}
