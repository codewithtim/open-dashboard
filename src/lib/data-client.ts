export interface Project {
    id: string;
    name: string;
    description?: string;
    type: string;
    status: string;
    platform?: string;
    platformAccountId?: string;
    link?: string;
    visibility?: string;
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
    isPrivate?: boolean;
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
    actualEndTime?: string;
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
    actualEndTime?: string;
    thumbnailUrl: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    duration: string;
    commitCount: number;
    projectIds: string[];
}

export interface Company {
    id: string;
    name: string;
    slug: string;
    website?: string;
    description?: string;
    logoUrl?: string;
    parentId?: string;
    createdAt: string;
}

export interface Agent {
    id: string;
    name: string;
    identifier: string;
    description?: string;
    companyId?: string;
    companyName?: string;
    status: string;
    currentTask?: string;
    lastSeenAt?: string;
    createdAt: string;
}

export interface AgentRepo {
    agentId: string;
    repoFullName: string;
}

export interface AgentCommit {
    id: number;
    agentId: string;
    repoFullName: string;
    sha: string;
    message: string;
    author: string;
    timestamp: string;
    htmlUrl: string;
    agentName?: string;
}

export type {
    ExpenseCategory,
    ExpenseSource,
    CostAllocation,
    Expense,
    ExpenseSummary,
    ProjectService,
    CreateExpenseInput,
} from './domain/expense-types';

import type { Expense, ExpenseSummary, ProjectService, CreateExpenseInput, CostAllocation } from './domain/expense-types';

export interface DataClient {
    getProjects(): Promise<Project[]>;
    getAllProjects(): Promise<Project[]>;
    getAggregatedDashboardStats(): Promise<DashboardStats>;
    getProjectDetails(projectId: string): Promise<ProjectDetails | null>;
    getMultipleProjectDetails(ids: string[]): Promise<ProjectDetails[]>;
    getStreams(): Promise<StreamSummary[]>;
    getStreamById(id: string): Promise<Stream | null>;
    getStreamCountForProject(projectId: string): Promise<number>;
    getRecentActivity(limit?: number): Promise<ActivityEvent[]>;
    getCompanies(): Promise<Company[]>;
    getAgents(): Promise<Agent[]>;
    getAgentCommits(limit?: number): Promise<AgentCommit[]>;

    // Expenses
    getExpenses(): Promise<Expense[]>;
    getExpensesByProject(projectId: string): Promise<Expense[]>;
    createExpense(input: CreateExpenseInput, allocations: CostAllocation[]): Promise<Expense>;
    getExpenseSummary(): Promise<ExpenseSummary>;

    // Project services
    getProjectServices(projectId: string): Promise<ProjectService[]>;
    getAllProjectServices(): Promise<ProjectService[]>;
    updateProjectServices(projectId: string, services: { vendor: string; exclusive: boolean }[]): Promise<void>;
}
