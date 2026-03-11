# Agent Dashboard Integration

You are connected to an activity dashboard at **https://www.timknightmedia.com/1hnai** that tracks what AI agents are working on. Your job is to register yourself, register your repos, and keep your status updated so the human operator has real-time visibility into what's happening.

## Credentials

You need two values. Ask the operator if you don't have them.

| Variable | Purpose |
|----------|---------|
| `AGENT_API_KEY` | Bearer token for all API calls |
| `AGENT_ID` | Your agent ID (you get this after registering — save it permanently) |

Base URL for all API calls:

```
https://www.timknightmedia.com/api
```

All requests (except `GET /api/agents/openapi`) require the header:

```
Authorization: Bearer $AGENT_API_KEY
```

---

## Step 1: Register yourself (one-time)

First check if you're already registered:

```bash
curl -s -H "Authorization: Bearer $AGENT_API_KEY" \
  https://www.timknightmedia.com/api/agents | jq '.[] | select(.identifier == "YOUR_GIT_AUTHOR_NAME")'
```

If you get a result, note the `id` field — that's your `AGENT_ID`. Skip to Step 2.

If not, register:

```bash
curl -s -X POST https://www.timknightmedia.com/api/agents \
  -H "Authorization: Bearer $AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your Display Name",
    "identifier": "your-git-author-name",
    "description": "Brief description of what you do",
    "companyId": "comp_xxx",
    "model": "claude-opus-4-6"
  }'
```

**Important fields:**

- `identifier` — **Must exactly match** the name you use in git commits (your `user.name` or `Co-Authored-By` name). This is how your commits get attributed to you on the dashboard. If this doesn't match, your commits won't appear.
- `companyId` — The company you belong to. Run `GET /api/companies` to see available companies, or ask the operator.
- `model` — The model ID you're running on (e.g. `claude-opus-4-6`, `claude-sonnet-4-6`, `gpt-4o`, `o3`).

Save the `id` from the response (e.g. `agt_abc123`). This is your `AGENT_ID` for all subsequent calls.

---

## Step 2: Register your repos (one-time, update when repos change)

Tell the dashboard which GitHub repos you commit to. **Without this, your commits will not appear on the dashboard.**

```bash
curl -s -X PUT https://www.timknightmedia.com/api/agents/$AGENT_ID/repos \
  -H "Authorization: Bearer $AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "repos": ["owner/repo-name", "owner/other-repo"]
  }'
```

Use the full `owner/repo` format (e.g. `acme-corp/backend`, `acme-corp/frontend`). List every repo you commit to. You can call this again any time to update the list — it replaces the previous list entirely.

---

## Step 3: Send a heartbeat now

Immediately after setup, send a heartbeat so the dashboard shows you as active:

```bash
curl -s -X POST https://www.timknightmedia.com/api/agents/$AGENT_ID/heartbeat \
  -H "Authorization: Bearer $AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "working",
    "currentTask": "Initial setup and registration"
  }'
```

---

## Step 4: Set up a recurring heartbeat cron job

Create a cron job that runs every 5 minutes to keep the dashboard updated with your current status. The cron should call the heartbeat endpoint with your current status and what you're working on.

### For Claude Code (recommended)

Add this to your `CLAUDE.md` or agent system prompt:

```
Every time you start a new task, send a heartbeat:
curl -s -X POST https://www.timknightmedia.com/api/agents/AGENT_ID/heartbeat \
  -H "Authorization: Bearer AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "working", "currentTask": "DESCRIPTION OF CURRENT TASK"}'

When you finish a task or go idle:
curl -s -X POST https://www.timknightmedia.com/api/agents/AGENT_ID/heartbeat \
  -H "Authorization: Bearer AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "idle", "currentTask": null}'
```

### For system crontab

If your agent runs as a long-lived process, add a system cron:

```bash
# Edit crontab
crontab -e

# Add this line (runs every 5 minutes):
*/5 * * * * curl -s -X POST https://www.timknightmedia.com/api/agents/AGENT_ID/heartbeat \
  -H "Authorization: Bearer AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "working", "currentTask": "Running"}' > /dev/null 2>&1
```

### For GitHub Actions (scheduled agent)

If your agent runs via GitHub Actions, add a heartbeat step:

```yaml
- name: Heartbeat — working
  run: |
    curl -s -X POST https://www.timknightmedia.com/api/agents/${{ secrets.AGENT_ID }}/heartbeat \
      -H "Authorization: Bearer ${{ secrets.AGENT_API_KEY }}" \
      -H "Content-Type: application/json" \
      -d '{"status": "working", "currentTask": "${{ github.workflow }} — ${{ github.event.inputs.task || github.event.head_commit.message }}"}'

# ... your agent work here ...

- name: Heartbeat — idle
  if: always()
  run: |
    curl -s -X POST https://www.timknightmedia.com/api/agents/${{ secrets.AGENT_ID }}/heartbeat \
      -H "Authorization: Bearer ${{ secrets.AGENT_API_KEY }}" \
      -H "Content-Type: application/json" \
      -d '{"status": "idle", "currentTask": null}'
```

Add `AGENT_ID` and `AGENT_API_KEY` as repository secrets.

---

## Heartbeat statuses

| Status | When to use |
|--------|------------|
| `working` | Actively executing a task. Set `currentTask` to a brief description. |
| `idle` | Finished work, waiting for next task. Set `currentTask` to `null`. |
| `offline` | Shutting down or going away for an extended period. |

---

## Updating your details

If you need to update your name, description, model, or company:

```bash
curl -s -X PATCH https://www.timknightmedia.com/api/agents/$AGENT_ID \
  -H "Authorization: Bearer $AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-opus-4-6",
    "description": "Updated description"
  }'
```

---

## Quick setup checklist

Run through this to confirm everything is working:

1. **Register** (or confirm already registered) → save your `AGENT_ID`
2. **Register repos** → `PUT /api/agents/{id}/repos` with all your repos
3. **Send first heartbeat** → confirm you show up on https://www.timknightmedia.com/1hnai
4. **Set up recurring heartbeat** → cron, GitHub Actions step, or in-prompt instructions
5. **Verify git identifier** → run `git config user.name` and confirm it exactly matches your `identifier`

---

## Quick reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/companies` | GET | List all companies |
| `/api/companies` | POST | Create a company |
| `/api/companies/{id}` | GET | Company details (with children + agents) |
| `/api/companies/{id}` | PATCH | Update a company |
| `/api/agents` | GET | List all agents |
| `/api/agents` | POST | Register yourself |
| `/api/agents/{id}` | GET | Your details (with repos and projects) |
| `/api/agents/{id}` | PATCH | Update your name/description/model/company |
| `/api/agents/{id}/heartbeat` | POST | Update status + current task |
| `/api/agents/{id}/repos` | PUT | Set your tracked repos |
| `/api/agents/{id}/projects` | PUT | Set your project assignments |
| `/api/agents/openapi` | GET | Full API spec (no auth needed) |

## Required environment variables for agents

| Variable | Description |
|----------|-------------|
| `AGENT_API_KEY` | Bearer token for authenticating with the dashboard API |
| `AGENT_ID` | Your agent ID returned from registration (e.g. `agt_abc123`) |
