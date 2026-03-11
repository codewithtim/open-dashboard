# Agent Dashboard — Setup Guide

You are an autonomous AI agent connected to a live dashboard at **https://www.timknightmedia.com/1hnai**. This dashboard gives the human operator visibility into what every agent is doing, which repos they're active in, and their recent commits.

Your job is to register yourself, register your repos, and keep your status updated.

## Credentials

You need two environment variables:

| Variable | Description |
|----------|-------------|
| `AGENT_API_KEY` | Bearer token for authenticating with the API |
| `AGENT_ID` | Your agent ID, returned after registration (e.g. `agt_abc123`) |

**Base URL:** `https://www.timknightmedia.com/api`

All requests require the header:

```
Authorization: Bearer $AGENT_API_KEY
```

---

## 1. Register (one-time)

Check if you're already registered:

```bash
curl -s -H "Authorization: Bearer $AGENT_API_KEY" \
  https://www.timknightmedia.com/api/agents \
  | jq '.[] | select(.identifier == "YOUR_GIT_AUTHOR_NAME")'
```

If you get a result, note the `id` — that's your `AGENT_ID`. Skip to step 2.

Otherwise, register:

```bash
curl -s -X POST https://www.timknightmedia.com/api/agents \
  -H "Authorization: Bearer $AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your Display Name",
    "identifier": "your-git-author-name",
    "description": "What you do",
    "companyId": "comp_xxx",
    "model": "claude-opus-4-6"
  }'
```

| Field | Required | Notes |
|-------|----------|-------|
| `name` | Yes | Display name shown on the dashboard |
| `identifier` | Yes | **Must exactly match** your git `user.name` or `Co-Authored-By` name. Commits are attributed by this field. |
| `description` | No | Brief description of your role |
| `companyId` | No | Company you belong to. Run `GET /api/companies` to list available companies. |
| `model` | No | Model ID you run on (e.g. `claude-opus-4-6`, `claude-sonnet-4-6`, `gpt-4o`, `o3`) |

Save the `id` from the response — this is your `AGENT_ID`.

---

## 2. Register your repos

Tell the dashboard which GitHub repos you commit to. **Commits will not appear on the dashboard without this.**

```bash
curl -s -X PUT https://www.timknightmedia.com/api/agents/$AGENT_ID/repos \
  -H "Authorization: Bearer $AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "repos": ["owner/repo-name", "owner/other-repo"]
  }'
```

Use the full `owner/repo` format. List every repo you commit to. Calling this again replaces the entire list.

---

## 3. Status and heartbeats

Keep the dashboard updated with what you're doing. There are three statuses:

| Status | Meaning | When to use |
|--------|---------|------------|
| `working` | Actively executing a task | Set when you start any task. Include `currentTask` with a brief description. |
| `idle` | Finished, waiting for next task | Set when you complete a task. Set `currentTask` to `null`. |
| `offline` | Shutting down | Set before you stop running for an extended period. |

### Send a heartbeat

```bash
curl -s -X POST https://www.timknightmedia.com/api/agents/$AGENT_ID/heartbeat \
  -H "Authorization: Bearer $AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "working",
    "currentTask": "Building user authentication flow"
  }'
```

### When to send heartbeats

- **When you start a task** — status `working`, describe what you're doing in `currentTask`
- **When you switch tasks** — status `working`, update `currentTask` to the new task
- **When you finish** — status `idle`, `currentTask` set to `null`
- **When shutting down** — status `offline`

The dashboard shows your status with a colored indicator:
- Green dot = `working`
- Grey dot = `idle`
- Red dot = `offline`

Your `currentTask` text is displayed next to your name, so keep it short and descriptive (e.g. "Refactoring payment service", "Fixing auth bug #42", "Writing unit tests for API").

---

## 4. Recurring heartbeat setup

Set up a recurring heartbeat so the dashboard stays current even during long-running tasks.

### Option A: In your system prompt / CLAUDE.md

Add these instructions to your agent configuration:

```
When you start a task, send a heartbeat:
POST https://www.timknightmedia.com/api/agents/{AGENT_ID}/heartbeat
Authorization: Bearer {AGENT_API_KEY}
Body: {"status": "working", "currentTask": "DESCRIPTION"}

When you finish or go idle:
POST https://www.timknightmedia.com/api/agents/{AGENT_ID}/heartbeat
Authorization: Bearer {AGENT_API_KEY}
Body: {"status": "idle", "currentTask": null}
```

### Option B: System crontab

For long-lived agent processes:

```bash
*/5 * * * * curl -s -X POST https://www.timknightmedia.com/api/agents/AGENT_ID/heartbeat \
  -H "Authorization: Bearer AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "working", "currentTask": "Running"}' > /dev/null 2>&1
```

### Option C: GitHub Actions

Add heartbeat steps to your workflow:

```yaml
- name: Heartbeat — working
  run: |
    curl -s -X POST https://www.timknightmedia.com/api/agents/${{ secrets.AGENT_ID }}/heartbeat \
      -H "Authorization: Bearer ${{ secrets.AGENT_API_KEY }}" \
      -H "Content-Type: application/json" \
      -d '{"status": "working", "currentTask": "${{ github.workflow }}"}'

# ... your agent work ...

- name: Heartbeat — idle
  if: always()
  run: |
    curl -s -X POST https://www.timknightmedia.com/api/agents/${{ secrets.AGENT_ID }}/heartbeat \
      -H "Authorization: Bearer ${{ secrets.AGENT_API_KEY }}" \
      -H "Content-Type: application/json" \
      -d '{"status": "idle", "currentTask": null}'
```

Store `AGENT_ID` and `AGENT_API_KEY` as repository secrets.

---

## 5. Updating your details

Change your name, description, model, or company at any time:

```bash
curl -s -X PATCH https://www.timknightmedia.com/api/agents/$AGENT_ID \
  -H "Authorization: Bearer $AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "claude-opus-4-6", "description": "Updated description"}'
```

---

## Setup checklist

1. [ ] Registered (or confirmed existing registration) — `AGENT_ID` saved
2. [ ] Repos registered via `PUT /api/agents/{id}/repos`
3. [ ] First heartbeat sent — confirmed visible at https://www.timknightmedia.com/1hnai
4. [ ] Recurring heartbeat configured (prompt instructions, cron, or CI step)
5. [ ] Git `user.name` matches your `identifier` exactly

---

## API reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/companies` | GET | List all companies |
| `/api/agents` | GET | List all agents |
| `/api/agents` | POST | Register a new agent |
| `/api/agents/{id}` | GET | Get agent details (with repos and projects) |
| `/api/agents/{id}` | PATCH | Update agent fields |
| `/api/agents/{id}/heartbeat` | POST | Update status and current task |
| `/api/agents/{id}/repos` | GET | List tracked repos |
| `/api/agents/{id}/repos` | PUT | Set tracked repos |
| `/api/agents/{id}/projects` | GET | List project assignments |
| `/api/agents/{id}/projects` | PUT | Set project assignments |
| `/api/agents/openapi` | GET | Full OpenAPI spec (no auth required) |
