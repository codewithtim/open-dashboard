# Feature Plan: Vercel Deployment

## Objective
Deploy the Open Dashboard Next.js application to Vercel for production hosting with all Notion environment variables configured, a CI pipeline that gates deploys on passing tests, and the daily cron job active.

## Prerequisites
- [x] All 27 tests passing
- [x] `next build` compiles successfully
- [x] Vercel CLI v41.6.2 installed
- [x] GitHub repo created and code pushed
- [x] `vercel.json` configured with `/api/cron` daily schedule

## Deployment Steps

### 1. Create GitHub Actions CI Workflow
- [x] Create `.github/workflows/ci.yml` that runs on pushes to `main` and on pull requests:
- [x] **Test job**: Install pnpm, install deps, run `pnpm test`
- [x] **Deploy job**: Depends on test job passing. Uses `vercel --prod` to deploy only when tests are green.
- [ ] Store `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` as GitHub Actions secrets.

### 2. Link Project to Vercel
- Run `vercel link` to connect the local project to your Vercel account/team
- Select or create the project when prompted
- Disable Vercel's automatic GitHub deploy (Settings > Git > Build & Deploy) since CI will handle deploys

### 3. Configure Environment Variables
Set these in Vercel project settings (Settings > Environment Variables) for **Production**, **Preview**, and **Development** scopes:

| Variable |
|---|
| `NOTION_TOKEN` |
| `NOTION_PARENT_PAGE_ID` |
| `NOTION_PROJECTS_DB_ID` |
| `NOTION_COSTS_DB_ID` |
| `NOTION_REVENUE_DB_ID` |
| `NOTION_METRICS_DB_ID` |
| `CRON_SECRET` |
| `USE_LOCAL_DATA` |

Values are in `.env.local` (gitignored). `CRON_SECRET` should be regenerated to a strong random value.

### 4. Post-Deploy Verification
- [ ] Production URL loads the dashboard
- [ ] Progress bar renders with `$0` / `Goal: $1,000,000` (databases are currently empty)
- [ ] Cron job registered: Vercel Dashboard > Project > Settings > Cron Jobs shows `/api/cron` at `0 0 * * *`
- [ ] Dynamic routes work: `/projects/[id]` returns 404 gracefully for nonexistent IDs
- [ ] GitHub Actions: confirm test failure blocks deploy

### 5. Update `research.md`
- [x] Revenue Progress Bar feature (component, home page integration)
- [x] Notion SDK fix (v2.2.15, correct filter types, property names)
- [x] CI/CD pipeline (GitHub Actions test-then-deploy workflow)
- [x] Vercel deployment configuration (env vars, cron job)

## Notes
- Vercel auto-detects Next.js — no custom build settings needed
- The pnpm lockfile is present so Vercel will use pnpm as the package manager
