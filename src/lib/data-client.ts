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

export type ActivityEventType = 'commit' | 'tweet' | 'stream_start' | 'stream_end';

export interface ActivityEventCommitPayload {
    sha: string;
    message: string;
    author: string;
    htmlUrl: string;
    repo: string;
}

export interface ActivityEventTweetPayload {
    text: string;
    likeCount: number;
    retweetCount: number;
    replyCount: number;
}

export interface ActivityEventStreamPayload {
    streamName: string;
    videoId: string;
    viewCount?: number;
    duration?: string;
}

export type ActivityEventPayload =
    | ActivityEventCommitPayload
    | ActivityEventTweetPayload
    | ActivityEventStreamPayload;

export interface ActivityEvent {
    id: string;
    type: ActivityEventType;
    timestamp: string;
    projectId?: string;
    projectName?: string;
    externalId: string;
    payload: ActivityEventPayload;
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
    getRecentActivity(limit?: number): Promise<ActivityEvent[]>;
}
