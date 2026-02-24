# Feature Plan: YouTube Data API Integration

## Objective
Update the `api/cron/route.ts` endpoint to fetch real-time channel statistics (Subscribers, Total Views, Video Count) from the official YouTube Data API v3, and dynamically upsert these metrics into the Notion database for each active YouTube project.

## Architecture & Domain-Driven Design

To ensure the system is extensible for future platforms (like TikTok or X), we will follow Domain-Driven Design (DDD) principles:
1. **Domain Model**: Define a core `SocialMetrics` interface representing consistent data (e.g., `subscribers`, `views`).
2. **Provider Pattern**: Create an abstract `MetricsProvider` interface. Each platform (e.g., `YouTubeMetricsProvider`, `TikTokMetricsProvider`) will implement this interface to fetch and normalize their specific API data into the core Domain Model.
3. **Repository/Data Access**: The cron job orchestrates by looking at a project's `platform`, instantiating the correct `MetricsProvider`, fetching the domain model, and passing it to the `NotionClient` for upserting.

### 1. Notion Database Update
   - Currently, projects have a `platform` property. We need a way to identify *which* specific channel or username belongs to the project. 
   - **Requirement**: We will add a new text property to the Notion Projects database called `Platform Account ID` (or `Channel ID` for YouTube) to store the unique identifier.

### 2. Cron Job Orchestration (`src/app/api/cron/route.ts`)
   - Query Notion for all active projects where `platform === 'youtube'`.
   - For each YouTube project, retrieve its associated `Channel ID`.
   - Make a native `fetch` request to the YouTube Data API `channels` endpoint:
     `GET https://www.googleapis.com/youtube/v3/channels?part=statistics&id={CHANNEL_ID}&key={YOUTUBE_API_KEY}`
   - Extract the `subscriberCount`, `viewCount`, and `videoCount` from the response.

3. **Notion Upsert Integration**:
   - Re-use the existing upsert logic inside the cron route.
   - For each metric (Subscribers, Views, Videos), query the Metrics database to see if a row exists for that project.
   - If it exists, `notion.pages.update()` with the new value.
   - If it does not exist, `notion.pages.create()`.

## Security & Environment Variables
- `YOUTUBE_API_KEY`: A new environment variable is required. This will be an API key generated from the Google Cloud Console with access to the YouTube Data API v3. 

## Implementation Steps (Test-Driven Development)

All features will be built strictly following TDD (Write failing tests first -> Implement -> Refactor).

- [ ] **DDD Architecture & Providers**: Write tests defining the `MetricsProvider` behavior. Implement `YouTubeMetricsProvider` to fetch and normalize YouTube Data API stats into the standardized `SocialMetrics` format.
- [ ] **Data Client Updates**: Update `src/lib/data-client.ts` to map a new `platformAccountId` property from the Notion database. Write unit tests for the parser first.
- [ ] **Cron Route Refactoring**: Update `src/app/api/cron/route.ts` using TDD to inject the correct provider factory based on the project's `platform`, fetch the standardized domain metrics, and dynamically upsert them.
