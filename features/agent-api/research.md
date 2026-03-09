# Research: Agent System

**Date:** 2026-03-10
**Scope:** Full agent data model — schema, data client, cron ingestion, UI rendering, seed script.

---

## Overview

The agent system tracks autonomous AI agents (e.g. Operator, Devin) and their git commits across configured repositories. Data flows in via a cron job that polls GitHub for commits authored by known agent identifiers, and is displayed on the `/1hnai` page ("1 Human, N AI"). There are currently **no write APIs** — agents and repos are seeded manually via a script, and commits are ingested passively by matching git author names.

---

## Entry Points

| Entry point | Type | Purpose |
|---|---|---|
| `GET /api/cron` | HTTP (cron-triggered) | Calls `processAgentCommits()` to ingest new commits |
| `scripts/seed-agents.ts` | CLI script | Inserts agents and their tracked repos into the DB |
| `/1hnai` (page) | Server component | Reads and displays agents + commits |

---

## Key Components

### Schema (`src/lib/db/schema.ts:88-118`)

Three tables:

1. **`agents`** — The agent identity.
   - `id` (text PK) — manually assigned (e.g. `'agent-operator'`)
   - `name` (text) — display name
   - `identifier` (text, unique index) — **must match the git commit author name** to link commits
   - `description` (text, nullable)
   - `createdAt` (text)

2. **`agent_repos`** — Many-to-many link: which repos each agent works in.
   - `agentId` (FK → agents.id)
   - `repoFullName` (text) — e.g. `'codewithtim/insider_trading_tracker'`
   - Composite PK on (agentId, repoFullName)

3. **`agent_commits`** — Individual commits attributed to an agent.
   - `id` (auto-increment integer PK)
   - `agentId` (FK → agents.id)
   - `repoFullName`, `sha`, `message`, `author`, `timestamp`, `htmlUrl`
   - `externalId` (unique) — formatted as `agent_commit:{sha}`
   - Indexed on `agentId` and `timestamp`

### TypeScript Interfaces (`src/lib/data-client.ts:114-137`)

- `Agent { id, name, identifier, description?, createdAt }`
- `AgentRepo { agentId, repoFullName }`
- `AgentCommit { id, agentId, repoFullName, sha, message, author, timestamp, htmlUrl, agentName? }`

`agentName` is a joined field (from agents table), not stored in agent_commits.

### DataClient Methods (`src/lib/turso-client.ts:348-390`)

- `getAgents()` — `SELECT *` from agents, maps rows.
- `getAgentCommits(limit=50)` — Joins `agent_commits` with `agents` (LEFT JOIN) to get `agentName`. Orders by timestamp DESC, limited.

No write methods exist on the DataClient for agents.

### Cron Ingestion (`src/app/api/cron/route.ts:295-348`, `processAgentCommits()`)

1. Loads all agents and all agent_repos.
2. Builds a `Map<identifier, agent>` for fast lookup.
3. Finds the most recent `agent_commits.timestamp` for incremental fetching (falls back to 7 days ago).
4. Deduplicates repos, then for each unique repo:
   - Fetches commits from GitHub API since the watermark.
   - For each commit, looks up `commit.author` in the identifier map.
   - If matched → inserts into `agent_commits` with `onConflictDoNothing`.
   - If no match (not an agent commit) → skipped silently.

**Key detail:** The matching is done by `commit.author` (git author name) against `agent.identifier`. This is how the system knows a commit was made by an agent.

### Seed Script (`scripts/seed-agents.ts`)

Hardcoded array of `AgentSeed` objects with id, name, identifier, description, and repos. Inserts with `onConflictDoNothing`. Currently only has Operator configured.

### UI (`src/app/1hnai/page.tsx` + `src/components/agent-commit-feed.tsx`)

- Server component fetches `getAgents()` and `getAgentCommits(100)` in parallel.
- Shows three stat cards: agent count, commit count, unique repo count.
- `AgentCommitFeed` renders each commit with: first line of message, SHA link, agent name badge, repo name, relative timestamp.

---

## Data Flow

```
1. Manual: seed-agents.ts → INSERT agents + agent_repos
2. Cron:   /api/cron GET → processAgentCommits()
             → GitHub API (getRecentCommits for each tracked repo)
             → Match commit.author against agent.identifier
             → INSERT agent_commits (onConflictDoNothing by externalId)
3. Read:   /1hnai page → getAgents() + getAgentCommits()
             → JOIN agent_commits ← agents (for agentName)
             → Render AgentCommitFeed component
```

---

## Intricacies & Edge Cases

- **Agent identification is by exact git author name match.** If an agent's git author name changes (e.g. `"Operator"` vs `"operator"`), commits will be missed. No case-insensitive matching.
- **Repos are shared across agents.** Multiple agents can be linked to the same repo. The cron fetches commits per-repo (deduped), then matches against all agent identifiers.
- **No status/activity tracking beyond commits.** There is no concept of "what an agent is currently working on", tasks, status updates, or project assignments.
- **The `agent_repos` table is never read by the DataClient.** It is only used by the cron to know which repos to poll. There is no `getAgentRepos()` method.
- **Incremental fetching watermark:** Uses the most recent `agent_commits.timestamp`. If the clock skews or commits have timestamps older than the watermark, they'll be missed. The `onConflictDoNothing` prevents duplicates.
- **No auth on read paths.** The `/1hnai` page is public. Only the cron endpoint requires `CRON_SECRET`.

---

## Interactions with the Rest of the System

- **Shares `GitHubCommitsProvider`** with the activity feed commit ingestion (`processActivity`). Same provider, different storage tables.
- **Independent from the main activity feed.** Agent commits go into `agent_commits`, not `activity_events`. They are displayed on `/1hnai`, not in the main `ActivityFeed` on the homepage.
- **No link to projects table.** Agents and their repos are not connected to the `projects` table. Agent repos are tracked separately in `agent_repos`.

---

## Known Issues & Technical Debt

- **No write API.** Adding agents/repos requires running the seed script or direct DB access. This is the gap the planned API would fill.
- **Hardcoded agent data** in the seed script. Not scalable if agents need to self-register.
- **Duplicate `timeAgo` function** — exists in both `activity-feed.tsx` and `agent-commit-feed.tsx`.
- **No pagination** on the `/1hnai` page — fetches up to 100 commits, all rendered at once.

---

## Summary of Key Facts

- Three tables: `agents`, `agent_repos`, `agent_commits` — all text PKs except agent_commits (auto-increment int).
- Agent identity matching: `agent.identifier` must exactly equal the git `commit.author` name.
- Commits ingested via cron by polling GitHub repos listed in `agent_repos`.
- No write API exists — agents/repos managed by seed script, commits by cron.
- DataClient has only two read methods: `getAgents()` and `getAgentCommits(limit)`.
- Agent system is fully independent from the main projects/activity system.
- The `/1hnai` page is public, the cron is auth-gated by `CRON_SECRET`.
