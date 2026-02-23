# Feature Plan: Project Platform Field

## Objective
Add an optional `platform` field to projects (e.g., youtube, tiktok) and update the cron job to dynamically find the YouTube project by platform rather than relying on a hardcoded env var.

## Current State
- The `platform` column already exists in the Notion Projects DB as a `select` type
- The `Project` interface in `data-client.ts` does not include `platform`
- The cron route references `YOUTUBE_PROJECT_ID` env var which doesn't exist, causing a validation error
- `NotionClient` and `LocalMockClient` don't read or return `platform`

## Implementation Steps

### 1. Update `Project` interface (`src/lib/data-client.ts`)
- Add `platform?: string` as an optional field on the `Project` interface

### 2. Update `NotionClient` (`src/lib/notion-client.ts`)
- Read the `platform` select property in `getProjects()` and `getProjectDetails()`
- Map it the same way as `type` and `status`: `props.platform?.select?.name || undefined`

### 3. Update `LocalMockClient` (`src/lib/local-mock-client.ts`)
- Add `platform` to relevant mock projects (e.g., `platform: 'youtube'` on the YouTube channel)

### 4. Update cron route (`src/app/api/cron/route.ts`)
- Remove the `YOUTUBE_PROJECT_ID` env var dependency
- Use the data client to call `getProjects()`, filter for `platform === 'youtube'`, and take the first match
- Use that project's `id` for the `projects` relation when inserting the metric
- Return an appropriate error if no YouTube project is found

### 5. Tests (TDD)
- `src/lib/__tests__/notion-client.test.ts`: Assert `platform` is returned from `getProjects()`
- `src/lib/__tests__/local-mock-client.test.ts`: Assert mock projects include `platform`
- `src/app/api/cron/__tests__/route.test.ts`: Assert the cron route looks up the project by platform and uses its ID in the relation; assert error handling when no YouTube project exists

## To-Do List

Steps 2-3 and 4-5 can run in parallel (NotionClient vs LocalMockClient). Everything converges at the cron route.

- [x] 1. Add `platform?: string` to `Project` interface in `data-client.ts`
- [x] 2. Write failing test: NotionClient `getProjects()` returns `platform` _(blocked by 1)_
- [x] 3. Implement: update NotionClient to read `platform` select property _(blocked by 2)_
- [x] 4. Write failing test: LocalMockClient projects include `platform` _(blocked by 1)_
- [x] 5. Implement: add `platform` to LocalMockClient mock data _(blocked by 4)_
- [x] 6. Write failing tests: cron route looks up project by platform, handles missing project _(blocked by 3, 5)_
- [x] 7. Implement: update cron route to find YouTube project by platform _(blocked by 6)_
- [x] 8. Run full test suite and verify no regressions — 32/32 pass _(blocked by 7)_
