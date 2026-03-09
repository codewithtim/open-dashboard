import { sqliteTable, text, real, integer, uniqueIndex, index, primaryKey } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable('projects', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    type: text('type').notNull(),
    description: text('description'),
    status: text('status').notNull().default('active'),
    platform: text('platform'),
    platformAccountId: text('platform_account_id'),
    link: text('link'),
    visibility: text('visibility').notNull().default('public'),
});

export const revenue = sqliteTable('revenue', {
    id: text('id').primaryKey(),
    projectId: text('project_id').notNull().references(() => projects.id),
    amount: real('amount').notNull(),
    note: text('note'),
}, (table) => [
    index('idx_revenue_project').on(table.projectId),
]);

export const costs = sqliteTable('costs', {
    id: text('id').primaryKey(),
    projectId: text('project_id').notNull().references(() => projects.id),
    amount: real('amount').notNull(),
    note: text('note'),
}, (table) => [
    index('idx_costs_project').on(table.projectId),
]);

export const metrics = sqliteTable('metrics', {
    id: text('id').primaryKey(),
    projectId: text('project_id').notNull().references(() => projects.id),
    name: text('name').notNull(),
    value: real('value').notNull(),
}, (table) => [
    uniqueIndex('idx_metrics_project_name').on(table.projectId, table.name),
]);

export const streams = sqliteTable('streams', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    videoId: text('video_id').notNull().unique(),
    actualStartTime: text('actual_start_time'),
    actualEndTime: text('actual_end_time'),
    thumbnailUrl: text('thumbnail_url'),
    viewCount: integer('view_count').default(0),
    likeCount: integer('like_count').default(0),
    commentCount: integer('comment_count').default(0),
    duration: text('duration'),
});

export const streamProjects = sqliteTable('stream_projects', {
    streamId: text('stream_id').notNull().references(() => streams.id),
    projectId: text('project_id').notNull().references(() => projects.id),
}, (table) => [
    primaryKey({ columns: [table.streamId, table.projectId] }),
]);

export const streamCommits = sqliteTable('stream_commits', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    streamId: text('stream_id').notNull().references(() => streams.id),
    sha: text('sha').notNull(),
    message: text('message'),
    author: text('author'),
    timestamp: text('timestamp'),
    htmlUrl: text('html_url'),
    repo: text('repo'),
    projectId: text('project_id').references(() => projects.id),
}, (table) => [
    index('idx_stream_commits_stream').on(table.streamId),
]);

export const activityEvents = sqliteTable('activity_events', {
    id: text('id').primaryKey(),
    type: text('type').notNull(),
    timestamp: text('timestamp').notNull(),
    projectId: text('project_id').references(() => projects.id),
    projectName: text('project_name'),
    externalId: text('external_id').notNull().unique(),
    payload: text('payload').notNull(),
}, (table) => [
    index('idx_activity_timestamp').on(table.timestamp),
]);

export const companies = sqliteTable('companies', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    website: text('website'),
    description: text('description'),
    logoUrl: text('logo_url'),
    parentId: text('parent_id'),
    createdAt: text('created_at').notNull(),
}, (table) => [
    uniqueIndex('idx_companies_slug').on(table.slug),
    index('idx_companies_parent').on(table.parentId),
]);

export const agents = sqliteTable('agents', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    identifier: text('identifier').notNull(),
    description: text('description'),
    companyId: text('company_id').references(() => companies.id),
    status: text('status').notNull().default('idle'),
    currentTask: text('current_task'),
    lastSeenAt: text('last_seen_at'),
    createdAt: text('created_at').notNull(),
}, (table) => [
    uniqueIndex('idx_agents_identifier').on(table.identifier),
    index('idx_agents_company').on(table.companyId),
]);

export const agentRepos = sqliteTable('agent_repos', {
    agentId: text('agent_id').notNull().references(() => agents.id),
    repoFullName: text('repo_full_name').notNull(),
}, (table) => [
    primaryKey({ columns: [table.agentId, table.repoFullName] }),
]);

export const agentProjects = sqliteTable('agent_projects', {
    agentId: text('agent_id').notNull().references(() => agents.id),
    projectId: text('project_id').notNull().references(() => projects.id),
}, (table) => [
    primaryKey({ columns: [table.agentId, table.projectId] }),
]);

export const agentCommits = sqliteTable('agent_commits', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    agentId: text('agent_id').notNull().references(() => agents.id),
    repoFullName: text('repo_full_name').notNull(),
    sha: text('sha').notNull(),
    message: text('message'),
    author: text('author'),
    timestamp: text('timestamp'),
    htmlUrl: text('html_url'),
    externalId: text('external_id').notNull().unique(),
}, (table) => [
    index('idx_agent_commits_agent').on(table.agentId),
    index('idx_agent_commits_timestamp').on(table.timestamp),
]);

export const expenses = sqliteTable('expenses', {
    id: text('id').primaryKey(),
    amount: real('amount').notNull(),
    vendor: text('vendor').notNull(),
    category: text('category').notNull(),
    note: text('note'),
    date: text('date').notNull(),
    periodStart: text('period_start'),
    periodEnd: text('period_end'),
    source: text('source').notNull().default('manual'),
    sourceRef: text('source_ref'),
    recurring: integer('recurring', { mode: 'boolean' }).notNull().default(false),
    currency: text('currency').notNull().default('USD'),
    createdAt: text('created_at').notNull(),
}, (table) => [
    index('idx_expenses_vendor').on(table.vendor),
    index('idx_expenses_date').on(table.date),
    index('idx_expenses_category').on(table.category),
]);

export const costProjects = sqliteTable('cost_projects', {
    id: text('id').primaryKey(),
    costId: text('cost_id').notNull().references(() => expenses.id),
    projectId: text('project_id').notNull().references(() => projects.id),
    allocation: real('allocation').notNull(),
}, (table) => [
    uniqueIndex('idx_cost_projects_cost_project').on(table.costId, table.projectId),
    index('idx_cost_projects_cost').on(table.costId),
    index('idx_cost_projects_project').on(table.projectId),
]);

export const projectServices = sqliteTable('project_services', {
    id: text('id').primaryKey(),
    projectId: text('project_id').notNull().references(() => projects.id),
    vendor: text('vendor').notNull(),
    exclusive: integer('exclusive', { mode: 'boolean' }).notNull().default(false),
}, (table) => [
    uniqueIndex('idx_project_services_project_vendor').on(table.projectId, table.vendor),
    index('idx_project_services_project').on(table.projectId),
]);
