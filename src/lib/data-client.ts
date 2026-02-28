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

export interface DashboardStats {
    totalRevenue: number;
    totalCosts: number;
    netProfit: number;
    totalSubscribers: number;
    totalViews: number;
    totalActiveUsers: number;
}

export interface StreamCommit {
    sha: string;
    message: string;
    author: string;
    timestamp: string;
    htmlUrl: string;
    repo: string;
    projectId: string;
}

export interface Stream {
    id: string;
    name: string;
    videoId: string;
    actualStartTime: string;
    actualEndTime: string;
    thumbnailUrl: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    duration: string;
    commits: StreamCommit[];
    projectIds: string[];
}

export interface StreamSummary {
    id: string;
    name: string;
    videoId: string;
    actualStartTime: string;
    actualEndTime: string;
    thumbnailUrl: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    duration: string;
    commitCount: number;
    projectIds: string[];
}

export interface DataClient {
    getProjects(): Promise<Project[]>;
    getAggregatedDashboardStats(): Promise<DashboardStats>;
    getProjectDetails(projectId: string): Promise<ProjectDetails | null>;
    getMultipleProjectDetails(ids: string[]): Promise<ProjectDetails[]>;
    getStreams(): Promise<StreamSummary[]>;
    getStreamById(id: string): Promise<Stream | null>;
    getStreamCountForProject(projectId: string): Promise<number>;
}
