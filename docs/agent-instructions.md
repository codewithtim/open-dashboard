# Agent Dashboard Integration

You are connected to an activity dashboard that tracks what AI agents are working on across the company. You should use this API to keep the dashboard updated with your status so the human operator has visibility into what's happening.

## Base URL

```
https://www.timknightmedia.com/api
```

## Authentication

All requests require a Bearer token:

```
Authorization: Bearer <your-api-key>
```

## What to do

### 1. Register yourself on first use

If you haven't registered before, register once:

```
POST /api/agents
{
  "name": "Your Name",
  "identifier": "your-git-author-name",
  "description": "Brief description of what you do",
  "companyId": "comp_xxx"
}
```

The `identifier` must match exactly the name you use for git commits — this is how your commits get attributed to you on the dashboard. The `companyId` links you to the company you belong to (ask the operator for your company ID, or check `GET /api/companies`). Save the `id` from the response (e.g. `agt_abc123`) for subsequent calls.

### 2. Send heartbeats while working

Whenever you start a task, update your status so the dashboard shows what you're doing:

```
POST /api/agents/{your-id}/heartbeat
{
  "status": "working",
  "currentTask": "Brief description of what you're doing right now"
}
```

When you finish or go idle:

```
POST /api/agents/{your-id}/heartbeat
{
  "status": "idle",
  "currentTask": null
}
```

Valid statuses: `idle`, `working`, `offline`.

### 3. Register the repos you work in

Tell the dashboard which GitHub repos you commit to, so it can track your commits:

```
PUT /api/agents/{your-id}/repos
{
  "repos": ["owner/repo-name", "owner/other-repo"]
}
```

### 4. Link yourself to projects (optional)

If you know which dashboard project IDs you're working on:

```
PUT /api/agents/{your-id}/projects
{
  "projectIds": ["project-id-1", "project-id-2"]
}
```

## Why we're doing this

The dashboard at `/1hnai` ("1 Human, N AI") displays all autonomous agents grouped by company, their current status, and their commit history. This gives the human operator real-time visibility into what every agent is working on, which repos they're active in, and their recent output. Think of it as a team status board — keep it updated so the operator knows you're running and what you're doing.

## Quick reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/companies` | GET | List all companies |
| `/api/companies` | POST | Create a company |
| `/api/companies/{id}` | GET | Company details (with children + agents) |
| `/api/companies/{id}` | PATCH | Update a company |
| `/api/agents` | POST | Register yourself |
| `/api/agents/{id}` | GET | Check your details |
| `/api/agents/{id}` | PATCH | Update your name/description/company |
| `/api/agents/{id}/heartbeat` | POST | Update status + current task |
| `/api/agents/{id}/repos` | PUT | Set your tracked repos |
| `/api/agents/{id}/projects` | PUT | Set your project assignments |
| `/api/agents/openapi` | GET | Full API spec (no auth needed) |
