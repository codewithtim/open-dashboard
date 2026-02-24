# Bug Fix Plan: Cron Job Primary Key Issue

## Objective
Fix the `src/app/api/cron/route.ts` endpoint so that it updates an existing metric row for a specific project instead of always creating a new row (which causes duplication and breaks the "primary key" concept of having one 'Subscribers' value per project).

## The Root Cause
Currently, the cron job executes:
```typescript
await notion.pages.create({ ... })
```
This blindly inserts a new page into the Metrics database every time the cron job runs, linking it to the YouTube project. Over time, the project will have hundreds of 'Subscribers' metrics instead of just keeping the latest one up to date.

## Proposed Solution (Upsert Logic)

Instead of just `create()`, the cron job needs to perform an "upsert":
1. **Query existing metrics**: Query the Metrics database (`process.env.NOTION_METRICS_DB_ID`) for a page where:
   - The Metric `name` equals "Subscribers"
   - AND the relation `projects` contains the specific `youtubeProject.id`.
2. **Conditional Update/Create**:
   - **If a page exists**, use `notion.pages.update({ page_id: existingPageId, properties: { value: { number: newValue } } })` to update the existing row.
   - **If it does not exist**, fall back to the existing `notion.pages.create({ ... })` logic to insert the first record.

## Affected Files
- `src/app/api/cron/route.ts`: Change the Notion integration logic from `create` to query + `update`/`create`.
- `src/app/api/cron/__tests__/route.test.ts`: Update tests. Instead of just mocking `pages.create`, we must mock `databases.query`, `pages.update`, and test both the "existing metric" and "new metric" paths.

## Next Steps (To-Do List)
- [ ] Share this bug plan for approval.
- [ ] Implement the upsert logic in `route.ts`.
- [ ] Update the test suite in `route.test.ts` to assert that it queries first, and then either updates or creates based on the existing data.
