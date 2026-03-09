# Plan: Agent API (Spec-First with Orval)

**Date:** 2026-03-10
**Status:** Complete

---

## Overview

Build an authenticated REST API for AI agents to self-register, report status, and manage their repos/projects. The OpenAPI spec is the source of truth — Orval generates Zod validation schemas and TypeScript types from it. Route handlers are hand-written, using the generated schemas for request validation.

---

## Approach

**Spec-first with Orval code generation:**

1. Write `docs/openapi.yaml` — the single source of truth for the API contract
2. Configure Orval to generate Zod schemas + types into `src/lib/api/generated/`
3. Add `pnpm generate:api` script for regeneration
4. Hand-write Next.js App Router route handlers that import generated Zod schemas for request body validation
5. Auth helper checks `Authorization: Bearer <AGENT_API_KEY>` on all endpoints (except OpenAPI spec endpoint)
6. Tests mock the database layer (Drizzle `getDb()`) and validate auth, validation, and happy paths

**Why Orval over openapi-typescript + openapi-zod-client:**
- Single tool generates both types and Zod schemas
- Most actively maintained (last published March 2026)
- Has a dedicated Zod output target that produces standalone schemas (no client wrapper dependency)

### Trade-offs

- **Orval as a dev dependency** — adds ~5MB to node_modules but zero runtime cost (only types + schemas)
- **Generated code in git** — the `src/lib/api/generated/` directory is committed so CI doesn't need to run generation. Trade-off: must remember to regenerate after spec changes. Mitigated by the `generate:api` npm script.
- **Single API key for all agents** — simpler than per-agent keys but means any agent can impersonate another. Acceptable for now since the agents are all trusted internal tools.

---

## Changes Required

### `docs/openapi.yaml` (new)

Full OpenAPI 3.1 spec. Key schemas:

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
  schemas:
    Agent:
      type: object
      properties:
        id: { type: string }
        name: { type: string }
        identifier: { type: string }
        description: { type: string, nullable: true }
        status: { type: string, enum: [idle, working, offline] }
        currentTask: { type: string, nullable: true }
        lastSeenAt: { type: string, format: date-time, nullable: true }
        createdAt: { type: string, format: date-time }
    CreateAgentRequest:
      type: object
      required: [name, identifier]
      properties:
        name: { type: string, minLength: 1 }
        identifier: { type: string, minLength: 1 }
        description: { type: string }
    UpdateAgentRequest:
      type: object
      properties:
        name: { type: string, minLength: 1 }
        description: { type: string }
        status: { type: string, enum: [idle, working, offline] }
        currentTask: { type: string, nullable: true }
    HeartbeatRequest:
      type: object
      properties:
        status: { type: string, enum: [idle, working, offline] }
        currentTask: { type: string, nullable: true }
    SetReposRequest:
      type: object
      required: [repos]
      properties:
        repos:
          type: array
          items: { type: string, pattern: "^[^/]+/[^/]+$" }
    SetProjectsRequest:
      type: object
      required: [projectIds]
      properties:
        projectIds:
          type: array
          items: { type: string }
```

Paths cover all 10 operations (GET/POST agents, GET/PATCH agent by id, heartbeat, repos GET/PUT, projects GET/PUT, openapi GET).

### `orval.config.ts` (new)

```typescript
import { defineConfig } from 'orval';

export default defineConfig({
  agentApi: {
    input: './docs/openapi.yaml',
    output: {
      mode: 'single',
      target: './src/lib/api/generated/agent-api.ts',
      client: 'zod',
      override: {
        zod: {
          strict: { body: true },
        },
      },
    },
  },
});
```

### `src/lib/api/generated/agent-api.ts` (generated — do not edit)

Orval generates Zod schemas like:
- `createAgentRequestBody` — validates POST /api/agents body
- `updateAgentRequestBody` — validates PATCH /api/agents/[id] body
- `heartbeatRequestBody` — validates POST heartbeat body
- `setReposRequestBody` — validates PUT repos body
- `setProjectsRequestBody` — validates PUT projects body

Plus TypeScript types inferred from each schema.

### `src/lib/db/schema.ts` (modify)

Add columns to `agents` table:
```typescript
status: text('status').notNull().default('idle'),
currentTask: text('current_task'),
lastSeenAt: text('last_seen_at'),
```

Add new table:
```typescript
export const agentProjects = sqliteTable('agent_projects', {
    agentId: text('agent_id').notNull().references(() => agents.id),
    projectId: text('project_id').notNull().references(() => projects.id),
}, (table) => [
    primaryKey({ columns: [table.agentId, table.projectId] }),
]);
```

### `src/lib/data-client.ts` (modify)

Update `Agent` interface:
```typescript
export interface Agent {
    id: string;
    name: string;
    identifier: string;
    description?: string;
    status: string;
    currentTask?: string;
    lastSeenAt?: string;
    createdAt: string;
}
```

### `src/lib/turso-client.ts` (modify)

Update `getAgents()` row mapping to include `status`, `currentTask`, `lastSeenAt`.

### `src/app/api/agents/_lib/auth.ts` (new)

```typescript
import { NextResponse } from 'next/server';

export function requireAgentAuth(request: Request): NextResponse | null {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.AGENT_API_KEY}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return null;
}
```

### `src/app/api/agents/route.ts` (new)

- **GET** — List all agents. Auth required. Returns `Agent[]`.
- **POST** — Register agent. Auth required. Validates body with `createAgentRequestBody` Zod schema. Generates `agt_` prefixed UUID. Sets `createdAt`, `lastSeenAt`, `status: 'idle'`. Returns 201. Returns 409 if identifier already exists.

### `src/app/api/agents/[id]/route.ts` (new)

- **GET** — Get agent by ID. Auth required. Includes repos (from `agent_repos`) and project IDs (from `agent_projects`). Returns 404 if not found.
- **PATCH** — Update agent fields. Auth required. Validates body with `updateAgentRequestBody`. Updates `lastSeenAt`. Returns 404 if not found.

### `src/app/api/agents/[id]/heartbeat/route.ts` (new)

- **POST** — Validates body with `heartbeatRequestBody`. Updates `status`, `currentTask`, `lastSeenAt`. Returns updated agent summary. Returns 404 if not found.

### `src/app/api/agents/[id]/repos/route.ts` (new)

- **GET** — List repos for agent. Returns `{ repos: string[] }`.
- **PUT** — Replace repos. Validates with `setReposRequestBody`. Deletes existing rows, inserts new ones. Returns the new list.

### `src/app/api/agents/[id]/projects/route.ts` (new)

- **GET** — List project IDs for agent. Returns `{ projectIds: string[] }`.
- **PUT** — Replace project assignments. Validates with `setProjectsRequestBody`. Deletes existing rows, inserts new ones. Returns 400 if any projectId doesn't exist.

### `src/app/api/agents/openapi/route.ts` (new)

- **GET** — No auth. Reads `docs/openapi.yaml`, parses to JSON, returns with `Content-Type: application/json`. Cached.

### `package.json` (modify)

Add scripts and dev dependency:
```json
{
  "scripts": {
    "generate:api": "orval"
  },
  "devDependencies": {
    "orval": "^8.5.3",
    "zod": "^3.24.0",
    "yaml": "^2.7.0"
  }
}
```

`zod` is a runtime dependency (used in route handlers for validation). `yaml` is for parsing the OpenAPI spec in the openapi route. `orval` is dev-only.

Move `zod` to `dependencies` and keep `orval` in `devDependencies`.

---

## Data & Migration

### Schema diff

```sql
-- agents table: add 3 columns
ALTER TABLE agents ADD COLUMN status TEXT NOT NULL DEFAULT 'idle';
ALTER TABLE agents ADD COLUMN current_task TEXT;
ALTER TABLE agents ADD COLUMN last_seen_at TEXT;

-- new table
CREATE TABLE agent_projects (
    agent_id TEXT NOT NULL REFERENCES agents(id),
    project_id TEXT NOT NULL REFERENCES projects(id),
    PRIMARY KEY (agent_id, project_id)
);
```

Generated via `npx drizzle-kit generate`. Existing agents get `status='idle'`, `currentTask=NULL`, `lastSeenAt=NULL`.

---

## Test Plan

All tests go in `__tests__/` directories alongside routes. Pattern: `src/app/api/agents/__tests__/route.test.ts`, etc.

### Auth tests (`src/app/api/agents/__tests__/auth.test.ts`)

| Test | Asserts |
|------|---------|
| Returns 401 when no Authorization header | 401 response with error message |
| Returns 401 when token is wrong | 401 response |
| Returns null (passes) when token is correct | null return value |

### GET /api/agents (`src/app/api/agents/__tests__/route.test.ts`)

| Test | Asserts |
|------|---------|
| Returns 401 without auth | 401 |
| Returns empty array when no agents | 200, `[]` |
| Returns all agents with new fields | 200, agents include status, currentTask, lastSeenAt |

### POST /api/agents (`src/app/api/agents/__tests__/route.test.ts`)

| Test | Asserts |
|------|---------|
| Returns 401 without auth | 401 |
| Creates agent with valid body | 201, agent has `agt_` prefix ID, status='idle', lastSeenAt set |
| Returns 400 when name is missing | 400 with validation error |
| Returns 400 when identifier is missing | 400 with validation error |
| Returns 409 when identifier already exists | 409 |

### GET /api/agents/[id] (`src/app/api/agents/[id]/__tests__/route.test.ts`)

| Test | Asserts |
|------|---------|
| Returns 401 without auth | 401 |
| Returns agent with repos and projects | 200, includes repos array and projectIds array |
| Returns 404 for unknown ID | 404 |

### PATCH /api/agents/[id] (`src/app/api/agents/[id]/__tests__/route.test.ts`)

| Test | Asserts |
|------|---------|
| Returns 401 without auth | 401 |
| Updates name and description | 200, fields updated, lastSeenAt updated |
| Updates status to valid value | 200 |
| Returns 400 for invalid status value | 400 |
| Returns 404 for unknown ID | 404 |

### POST /api/agents/[id]/heartbeat (`src/app/api/agents/[id]/heartbeat/__tests__/route.test.ts`)

| Test | Asserts |
|------|---------|
| Returns 401 without auth | 401 |
| Updates status and currentTask | 200, both fields updated, lastSeenAt updated |
| Clears currentTask when null | 200, currentTask is null |
| Returns 404 for unknown ID | 404 |

### GET /api/agents/[id]/repos (`src/app/api/agents/[id]/repos/__tests__/route.test.ts`)

| Test | Asserts |
|------|---------|
| Returns 401 without auth | 401 |
| Returns repos for agent | 200, `{ repos: [...] }` |
| Returns empty array when no repos | 200, `{ repos: [] }` |

### PUT /api/agents/[id]/repos (`src/app/api/agents/[id]/repos/__tests__/route.test.ts`)

| Test | Asserts |
|------|---------|
| Returns 401 without auth | 401 |
| Replaces repos | 200, old repos gone, new repos returned |
| Returns 400 for invalid repo format | 400 (must be `owner/repo`) |
| Returns 404 for unknown agent ID | 404 |

### GET /api/agents/[id]/projects (`src/app/api/agents/[id]/projects/__tests__/route.test.ts`)

| Test | Asserts |
|------|---------|
| Returns 401 without auth | 401 |
| Returns project IDs for agent | 200, `{ projectIds: [...] }` |

### PUT /api/agents/[id]/projects (`src/app/api/agents/[id]/projects/__tests__/route.test.ts`)

| Test | Asserts |
|------|---------|
| Returns 401 without auth | 401 |
| Replaces project assignments | 200, new project IDs returned |
| Returns 400 when project ID doesn't exist | 400 |
| Returns 404 for unknown agent ID | 404 |

### GET /api/agents/openapi (`src/app/api/agents/openapi/__tests__/route.test.ts`)

| Test | Asserts |
|------|---------|
| Returns OpenAPI spec without auth | 200 |
| Response is valid JSON with openapi field | Has `openapi` and `paths` keys |

---

## Task Breakdown

- [x] **Task 1: Install dependencies** — `pnpm add zod yaml` and `pnpm add -D orval`. Add `"generate:api": "orval"` to package.json scripts.
- [x] **Task 2: Write OpenAPI spec** — Create `docs/openapi.yaml` with all paths, schemas, security schemes, and examples.
- [x] **Task 3: Configure Orval** — Create `orval.config.ts` at project root. Configure Zod output target to `src/lib/api/generated/agent-api.ts`.
- [x] **Task 4: Generate schemas** — Run `pnpm generate:api`. Verify generated Zod schemas match the spec. Commit generated file.
- [x] **Task 5: Schema changes** — Add `status`, `currentTask`, `lastSeenAt` columns to `agents` table in `src/lib/db/schema.ts`. Add `agentProjects` table.
- [x] **Task 6: Generate migration** — Run `npx drizzle-kit generate`. Verify generated SQL.
- [x] **Task 7: Update Agent interface** — Add `status`, `currentTask`, `lastSeenAt` to `Agent` in `src/lib/data-client.ts`.
- [x] **Task 8: Update turso-client** — Map new columns in `getAgents()` row mapper in `src/lib/turso-client.ts`.
- [x] **Task 9: Auth helper** — Create `src/app/api/agents/_lib/auth.ts` with `requireAgentAuth()`.
- [x] **Task 10: Auth tests** — Create `src/app/api/agents/__tests__/auth.test.ts`.
- [x] **Task 11: GET/POST /api/agents route** — Create `src/app/api/agents/route.ts`. Use generated Zod schema for POST validation.
- [x] **Task 12: GET/POST agents tests** — Create `src/app/api/agents/__tests__/route.test.ts`.
- [x] **Task 13: GET/PATCH /api/agents/[id] route** — Create `src/app/api/agents/[id]/route.ts`. Use generated Zod schema for PATCH validation.
- [x] **Task 14: GET/PATCH agent tests** — Create `src/app/api/agents/[id]/__tests__/route.test.ts`.
- [x] **Task 15: POST /api/agents/[id]/heartbeat route** — Create `src/app/api/agents/[id]/heartbeat/route.ts`.
- [x] **Task 16: Heartbeat tests** — Create `src/app/api/agents/[id]/heartbeat/__tests__/route.test.ts`.
- [x] **Task 17: GET/PUT /api/agents/[id]/repos route** — Create `src/app/api/agents/[id]/repos/route.ts`.
- [x] **Task 18: Repos tests** — Create `src/app/api/agents/[id]/repos/__tests__/route.test.ts`.
- [x] **Task 19: GET/PUT /api/agents/[id]/projects route** — Create `src/app/api/agents/[id]/projects/route.ts`.
- [x] **Task 20: Projects tests** — Create `src/app/api/agents/[id]/projects/__tests__/route.test.ts`.
- [x] **Task 21: GET /api/agents/openapi route** — Create `src/app/api/agents/openapi/route.ts`.
- [x] **Task 22: OpenAPI route tests** — Create `src/app/api/agents/openapi/__tests__/route.test.ts`.
- [x] **Task 23: Type-check and full test run** — Run `pnpm typecheck && pnpm test` to verify everything passes.
- [x] **Task 24: Update 1H:NAI page** — Show agent status indicators on `/1hnai` using the new fields.
