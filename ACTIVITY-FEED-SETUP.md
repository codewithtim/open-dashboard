# Activity Feed — Setup Guide

The activity feed shows a unified timeline of commits, tweets, and stream events on the homepage. Commits and streams are already ingested by the existing cron job — the only new pieces are a **Notion database** to store activity events and (optionally) a **Twitter API token** for tweets.

## 1. Create the Notion Activity Database

In your Notion workspace, create a new database with these properties:

| Property       | Type      | Notes                                                        |
|----------------|-----------|--------------------------------------------------------------|
| Name           | Title     | Auto-generated summary (e.g. commit message first line)      |
| type           | Select    | Options: `commit`, `tweet`, `stream_start`, `stream_end`     |
| timestamp      | Date      | When the event occurred                                      |
| payload        | Rich text | JSON blob with event-specific data                           |
| projectId      | Rich text | Notion page ID of the related project (optional)             |
| projectName    | Rich text | Human-readable project name (optional)                       |
| externalId     | Rich text | Dedup key, e.g. `commit:abc123` or `tweet:456`               |

Then add the database ID to your environment:

```
NOTION_ACTIVITY_DB_ID=<your-database-id>
```

Add it to `.env.local` for local dev and to your Vercel environment variables for production.

> **Without this variable**, `getRecentActivity()` returns `[]` and the feed is hidden — nothing breaks.

## 2. Twitter / X API (optional)

This is the only net-new external API. If you skip it, the cron job logs a message and moves on — commits and streams still get ingested.

### Get a Bearer Token

1. Go to the [Twitter Developer Portal](https://developer.x.com/en/portal/dashboard)
2. Create a project and app (Free tier works for read-only access)
3. Generate a **Bearer Token** from the app's "Keys and Tokens" page

### Add to environment

```
TWITTER_BEARER_TOKEN=<your-bearer-token>
```

### Link a project

For tweets to be ingested, you need a project in your Notion Projects database with:
- **Platform**: `twitter` or `x`
- **Platform Account ID**: the Twitter **user ID** (numeric, not the @handle)

You can find your numeric user ID at [tweeterid.com](https://tweeterid.com/).

## 3. What's already wired up

These require **no additional setup** — they use existing credentials:

| Source          | How it works                                                    | Existing env vars used     |
|-----------------|-----------------------------------------------------------------|----------------------------|
| **Commits**     | Fetches recent commits from all GitHub-platform projects        | `GITHUB_TOKEN` (optional)  |
| **Streams**     | Converts existing stream records into start/end activity events | `NOTION_STREAMS_DB_ID`     |

The cron job (`/api/cron`) runs `processActivity()` after the existing metrics and streams processing. It deduplicates by `externalId`, so re-running is safe.

## 4. Verify

1. **Local with mock data**: `USE_LOCAL_DATA=true npm run dev` — the homepage shows the feed with test data
2. **Local with real data**: set `NOTION_ACTIVITY_DB_ID` in `.env.local`, hit `/api/cron?` with the correct `Authorization: Bearer <CRON_SECRET>` header, then reload the homepage
3. **Production**: add `NOTION_ACTIVITY_DB_ID` (and optionally `TWITTER_BEARER_TOKEN`) to Vercel env vars, redeploy, and trigger the cron
