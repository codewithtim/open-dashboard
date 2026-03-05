# Notion → Turso (SQLite) Migration Plan

## Why

Notion is slow for reads (multiple API round-trips per page load), has a 2000-char rich_text limit that forces JSON chunking, and rate-limits at scale. Turso gives us a single SQLite database at the edge with sub-millisecond reads and proper relational queries.

---

## New Dependencies

```
@libsql/client   — Turso's SDK (libSQL over HTTP)
drizzle-orm       — Type-safe query builder
drizzle-kit       — CLI for generating and running migrations
```

## New Environment Variables

```
TURSO_DATABASE_URL   — libsql://your-db-name-your-org.turso.io
TURSO_AUTH_TOKEN     — database auth token from Turso dashboard
```

Add these as GitHub Actions secrets (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`) and to Vercel environment variables.

---

## Migrations Tooling

All schema changes go through **Drizzle Kit CLI** — never write SQL migration files by hand.

### Workflow

1. Edit the Drizzle schema in `src/lib/db/schema.ts`
2. Run `npx drizzle-kit generate` — this diffs the schema against existing migrations and outputs a new numbered SQL file in `drizzle/migrations/`
3. Commit the schema change + generated migration file together
4. On push to `main`, the GitHub Actions deploy job runs `npx drizzle-kit migrate` against the production Turso database before deploying to Vercel

### Config

`drizzle.config.ts` at project root:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
```

### GitHub Actions

Add a `migrate` step to the deploy job in `.github/workflows/ci.yml`, running **before** the Vercel build:

```yaml
deploy:
  name: Deploy to Vercel
  needs: test
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - uses: pnpm/action-setup@v4
      with:
        version: 9

    - uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: pnpm

    - run: pnpm install --frozen-lockfile

    # Run pending Drizzle migrations against Turso
    - name: Run database migrations
      run: npx drizzle-kit migrate
      env:
        TURSO_DATABASE_URL: ${{ secrets.TURSO_DATABASE_URL }}
        TURSO_AUTH_TOKEN: ${{ secrets.TURSO_AUTH_TOKEN }}

    - run: pnpm add -g vercel

    - name: Pull Vercel environment
      run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      env:
        VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
        VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

    - name: Build
      run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      env:
        VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
        VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

    - name: Deploy
      run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
      env:
        VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
        VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

Migrations run before deploy so the database schema is always ahead of or in sync with the application code. `drizzle-kit migrate` is a no-op if there are no pending migrations, so every deploy is safe.

---

## Drizzle Schema

`src/lib/db/schema.ts` — this is the single source of truth. Drizzle Kit generates migrations from it.

```typescript
import { sqliteTable, text, real, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  status: text('status').notNull().default('active'),
  platform: text('platform'),
  platformAccountId: text('platform_account_id'),
  link: text('link'),
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
  index('idx_stream_projects_stream').on(table.streamId),
  index('idx_stream_projects_project').on(table.projectId),
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
```

### Key improvements over Notion

- **Commits** are proper rows instead of a JSON blob chunked into 2000-char rich_text segments
- **Metrics** have a `UNIQUE(project_id, name)` constraint — upserts become `INSERT ... ON CONFLICT ... DO UPDATE` instead of query-then-update
- **Activity** dedup uses a unique index on `external_id` — same single-statement upsert
- **Stream↔Project** is a proper junction table instead of a Notion relation
- **Aggregations** (total revenue, total costs, subscriber counts) are single SQL queries instead of fetching all rows and summing in JS

---

## Implementation Steps

### Step 1: Set up Turso + Drizzle

1. Install dependencies: `pnpm add @libsql/client drizzle-orm && pnpm add -D drizzle-kit`
2. Create `src/lib/db/schema.ts` (Drizzle schema above)
3. Create `drizzle.config.ts` (config above)
4. Create `src/lib/db/index.ts` — singleton Drizzle client:

```typescript
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

export const db = drizzle({
  connection: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
  schema,
});
```

5. Generate the initial migration: `npx drizzle-kit generate`
6. Apply it locally or to a dev Turso DB: `npx drizzle-kit migrate`

### Step 2: Create `TursoClient` implementing `DataClient`

New file: `src/lib/turso-client.ts`

Implement every method from the `DataClient` interface using Drizzle queries:

| DataClient method | Notion approach | Turso approach |
|---|---|---|
| `getProjects()` | Query PROJECTS_DB, filter active | `db.select().from(projects).where(eq(projects.status, 'active'))` |
| `getAggregatedDashboardStats()` | 4 parallel Notion queries + JS aggregation | Single query with JOINs and SUMs |
| `getProjectDetails(id)` | 4 parallel queries, filter in memory | Single query joining projects, costs, revenue, metrics |
| `getMultipleProjectDetails(ids)` | 4 bulk queries, filter in memory | Same JOIN query with `WHERE id IN (...)` |
| `getStreams()` | Query + parse JSON commits blob | SELECT streams with COUNT of commits via subquery |
| `getStreamById(id)` | Query + parse JSON commits | JOIN streams with stream_commits |
| `getStreamCountForProject(id)` | Query with relation filter | `SELECT COUNT(*) FROM stream_projects WHERE project_id = ?` |
| `getRecentActivity(limit)` | Query + parse JSON payloads | `db.select().from(activityEvents).orderBy(desc(...)).limit(n)` |

### Step 3: Update `client-factory.ts`

```typescript
export function getDataClient(): DataClient {
    if (process.env.USE_LOCAL_DATA === 'true') {
        return new LocalMockClient();
    }
    return new TursoClient();  // was NotionClient
}
```

The `NotionClient` stays in the codebase until migration is verified — just no longer the default.

### Step 4: Update cron job writes

Replace all `notion.databases.query` / `notion.pages.create` / `notion.pages.update` calls in `src/app/api/cron/route.ts` with Drizzle upserts:

| Cron operation | Notion (2 API calls each) | Turso (1 statement each) |
|---|---|---|
| Upsert metric | Query by name+relation, then create/update | `db.insert(metrics).values(...).onConflictDoUpdate(...)` |
| Upsert stream | Query by videoId, then create/update | `db.insert(streams).values(...).onConflictDoUpdate(...)` |
| Upsert stream commits | Write JSON blob to rich_text | `db.insert(streamCommits).values(...)` (individual rows) |
| Upsert activity | Query by externalId, then create/update | `db.insert(activityEvents).values(...).onConflictDoUpdate(...)` |

### Step 5: Update GitHub Actions

Add the `Run database migrations` step to `.github/workflows/ci.yml` as shown in the GitHub Actions section above. Add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` as repository secrets.

### Step 6: Create Notion → Turso data migration script

New file: `scripts/migrate-from-notion.ts`

A one-time script that reads all data from Notion and writes it to Turso. Run with `npx ts-node scripts/migrate-from-notion.ts`.

```
1. Read all projects from NOTION_PROJECTS_DB_ID
   → db.insert(projects).values(...)

2. Read all revenue from NOTION_REVENUE_DB_ID
   → Resolve project relation → db.insert(revenue).values(...)

3. Read all costs from NOTION_COSTS_DB_ID
   → Same pattern → db.insert(costs).values(...)

4. Read all metrics from NOTION_METRICS_DB_ID
   → Resolve project relation → db.insert(metrics).values(...)

5. Read all streams from NOTION_STREAMS_DB_ID
   → db.insert(streams).values(...)
   → Parse commits JSON → db.insert(streamCommits).values(...) (one row per commit)
   → Resolve project relations → db.insert(streamProjects).values(...)

6. Read all activity from NOTION_ACTIVITY_DB_ID
   → db.insert(activityEvents).values(...)
```

The script should:
- Use the existing `notion` client and `queryNotionDb` helper from `notion-client.ts`
- Use the existing `normalizeProps` / `isPageObject` helpers
- Handle Notion pagination (100 results per page) using `start_cursor`
- Log progress per table
- Be idempotent (use `onConflictDoNothing()`) so it can be re-run safely

### Step 7: Remove Notion dependency

Once Turso is verified in production:
- Remove `@notionhq/client` from `package.json`
- Delete `src/lib/notion-client.ts`
- Remove all `NOTION_*` env vars from Vercel and GitHub secrets
- Remove the `notion` import from the cron route
- Delete `scripts/migrate-from-notion.ts`

---

## Files Changed / Created

| File | Action |
|------|--------|
| `src/lib/db/schema.ts` | Create — Drizzle schema (single source of truth) |
| `src/lib/db/index.ts` | Create — Turso/Drizzle client singleton |
| `drizzle.config.ts` | Create — Drizzle Kit config |
| `drizzle/migrations/` | Generated — by `drizzle-kit generate` (committed to repo) |
| `src/lib/turso-client.ts` | Create — TursoClient implementing DataClient |
| `src/lib/client-factory.ts` | Modify — default to TursoClient |
| `src/app/api/cron/route.ts` | Modify — replace Notion writes with Drizzle upserts |
| `.github/workflows/ci.yml` | Modify — add migration step before deploy |
| `scripts/migrate-from-notion.ts` | Create — one-time data migration script |
| `package.json` | Modify — add @libsql/client, drizzle-orm, drizzle-kit |
| `src/lib/notion-client.ts` | Delete (after verification) |

---

## Rollback Plan

The `NotionClient` stays in the codebase during migration. Rolling back is a one-line change in `client-factory.ts` to switch back to `NotionClient`. The cron job can similarly be switched back since Notion data isn't being deleted.

---

## Verification

1. Run `npx drizzle-kit generate` → migration file appears in `drizzle/migrations/`
2. Run `npx drizzle-kit migrate` → tables created in Turso
3. Run `npx ts-node scripts/migrate-from-notion.ts` → row counts match Notion page counts
4. `USE_LOCAL_DATA=true pnpm dev` → unchanged (mock client still works)
5. Switch to TursoClient locally → homepage, streams pages, stream detail all render correctly
6. Trigger cron → metrics, streams, activity events all upsert correctly
7. `pnpm test` → all tests pass (they mock the DataClient, so unaffected)
8. Push to main → GitHub Actions runs migrations then deploys to Vercel
