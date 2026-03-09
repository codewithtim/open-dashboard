# Plan: Agent API

An authenticated REST API that allows AI agents to self-register, report what they're working on, and manage their repos/projects. Includes an OpenAPI spec.

---

## Architecture Decisions

- **API key auth via `AGENT_API_KEY` env var.** Single shared key checked in middleware. Simple, matches the existing `CRON_SECRET` pattern. The key is given to each agent.
- **Route group:** `src/app/api/agents/` — RESTful endpoints under a single namespace.
- **OpenAPI spec:** Static `openapi.yaml` at project root (or `docs/`), hand-maintained alongside route changes. Keeps the spec as the contract.
- **New schema additions:** Add `status` and `currentTask` fields to the agents table so agents can report what they're working on. Add an `agent_projects` join table to link agents to projects.
- **No DataClient changes for writes.** Write operations go directly through Drizzle in the API routes (same pattern as `/api/expenses`).

---

## Schema Changes

### 1. Alter `agents` table

Add columns:
```typescript
// src/lib/db/schema.ts — agents table
status: text('status').notNull().default('idle'),         // 'idle' | 'working' | 'offline'
currentTask: text('current_task'),                         // Free-text: what the agent is doing right now
lastSeenAt: text('last_seen_at'),                          // ISO timestamp, updated on any API call
```

### 2. New `agent_projects` table

```typescript
export const agentProjects = sqliteTable('agent_projects', {
    agentId: text('agent_id').notNull().references(() => agents.id),
    projectId: text('project_id').notNull().references(() => projects.id),
}, (table) => [
    primaryKey({ columns: [table.agentId, table.projectId] }),
]);
```

This links agents to dashboard projects (e.g. "Operator works on insider_trading_tracker project").

---

## API Endpoints

All endpoints require `Authorization: Bearer <AGENT_API_KEY>` header.

### Agents

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/agents` | List all agents |
| `POST` | `/api/agents` | Register a new agent (self-registration) |
| `GET` | `/api/agents/[id]` | Get agent details (with repos & projects) |
| `PATCH` | `/api/agents/[id]` | Update agent (status, currentTask, description) |

### Agent Repos

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/agents/[id]/repos` | List repos tracked by this agent |
| `PUT` | `/api/agents/[id]/repos` | Set the full list of repos for this agent (replace) |

### Agent Status / Heartbeat

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/agents/[id]/heartbeat` | Update status + currentTask + lastSeenAt in one call |

### Agent Projects

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/agents/[id]/projects` | List projects this agent is assigned to |
| `PUT` | `/api/agents/[id]/projects` | Set project assignments (by project ID) |

### Discovery (no auth)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/agents/openapi` | Serve the OpenAPI spec as JSON |

---

## Tasks

### Task 1: Schema changes + migration
- [ ] Add `status`, `currentTask`, `lastSeenAt` columns to `agents` table in `src/lib/db/schema.ts`
- [ ] Add `agentProjects` table in `src/lib/db/schema.ts`
- [ ] Run `npx drizzle-kit generate` to create migration
- [ ] Verify generated SQL

### Task 2: Auth middleware helper
- [ ] Create `src/app/api/agents/_lib/auth.ts` with a `requireAgentAuth(request)` function
- [ ] Checks `Authorization: Bearer <AGENT_API_KEY>` against `process.env.AGENT_API_KEY`
- [ ] Returns 401 NextResponse if invalid

### Task 3: Agent CRUD routes
- [ ] `src/app/api/agents/route.ts` — GET (list), POST (register)
- [ ] `src/app/api/agents/[id]/route.ts` — GET (detail), PATCH (update)
- [ ] POST creates agent with auto-generated UUID, sets `createdAt` and `lastSeenAt`
- [ ] PATCH allows updating: `name`, `description`, `status`, `currentTask`
- [ ] Update `lastSeenAt` on every authenticated write call

### Task 4: Agent repos routes
- [ ] `src/app/api/agents/[id]/repos/route.ts` — GET, PUT
- [ ] PUT accepts `{ repos: ["owner/repo", ...] }`, deletes existing and inserts new (transactional replace)

### Task 5: Agent heartbeat route
- [ ] `src/app/api/agents/[id]/heartbeat/route.ts` — POST
- [ ] Accepts `{ status?: string, currentTask?: string }`
- [ ] Updates `status`, `currentTask`, `lastSeenAt` on the agent row

### Task 6: Agent projects routes
- [ ] `src/app/api/agents/[id]/projects/route.ts` — GET, PUT
- [ ] PUT accepts `{ projectIds: ["proj-1", ...] }`, replaces agent_projects rows

### Task 7: Update DataClient + UI for new fields
- [ ] Add `status`, `currentTask`, `lastSeenAt` to `Agent` interface in `data-client.ts`
- [ ] Update `rowToAgent` mapping in `turso-client.ts`
- [ ] Update `/1hnai` page to show agent status indicators

### Task 8: OpenAPI spec
- [ ] Create `docs/openapi.yaml` with full spec for all endpoints
- [ ] Include request/response schemas, auth description, example values
- [ ] Add `GET /api/agents/openapi` route that serves the spec

### Task 9: Tests
- [ ] Unit tests for each route (auth rejection, happy path, validation)
- [ ] Test auth middleware independently

---

## Request/Response Examples

### POST /api/agents (register)
```json
// Request
{
  "name": "Operator",
  "identifier": "Operator",
  "description": "Autonomous coding agent"
}

// Response 201
{
  "id": "agt_abc123",
  "name": "Operator",
  "identifier": "Operator",
  "description": "Autonomous coding agent",
  "status": "idle",
  "currentTask": null,
  "lastSeenAt": "2026-03-10T12:00:00Z",
  "createdAt": "2026-03-10T12:00:00Z"
}
```

### POST /api/agents/{id}/heartbeat
```json
// Request
{
  "status": "working",
  "currentTask": "Refactoring SEC Form 4 parser for edge cases"
}

// Response 200
{
  "id": "agt_abc123",
  "status": "working",
  "currentTask": "Refactoring SEC Form 4 parser for edge cases",
  "lastSeenAt": "2026-03-10T12:05:00Z"
}
```

### PUT /api/agents/{id}/repos
```json
// Request
{
  "repos": [
    "codewithtim/insider_trading_tracker",
    "codewithtim/open-dashboard"
  ]
}

// Response 200
{
  "repos": [
    "codewithtim/insider_trading_tracker",
    "codewithtim/open-dashboard"
  ]
}
```

---

## Notes

- The `identifier` field remains the key for matching git commits to agents in the cron. Agents should set this to their git author name.
- ID format: `agt_` prefix + UUID to distinguish from other entity IDs.
- The existing seed script can remain for bootstrapping but becomes optional once agents can self-register.
- The cron `processAgentCommits()` needs no changes — it already reads agents/repos from the DB.
