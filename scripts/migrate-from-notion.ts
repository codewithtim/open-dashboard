/**
 * One-time migration script: reads all data from Notion and writes it to Turso.
 *
 * Usage:
 *   npx ts-node scripts/migrate-from-notion.ts
 *
 * Required env vars:
 *   NOTION_TOKEN, NOTION_PROJECTS_DB_ID, NOTION_COSTS_DB_ID, NOTION_REVENUE_DB_ID,
 *   NOTION_METRICS_DB_ID, NOTION_STREAMS_DB_ID, NOTION_ACTIVITY_DB_ID,
 *   TURSO_DATABASE_URL, TURSO_AUTH_TOKEN
 *
 * Idempotent — safe to re-run (uses INSERT OR REPLACE / ON CONFLICT DO NOTHING).
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import { Client } from '@notionhq/client';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../src/lib/db/schema';

// --- Notion helpers (copied from notion-client.ts to keep this self-contained) ---

const notion = new Client({ auth: process.env.NOTION_TOKEN });

type NotionText = { plain_text: string };
type NotionProp = {
    rich_text?: NotionText[];
    title?: NotionText[];
    select?: { name: string } | null;
    status?: { name: string } | null;
    number?: number | null;
    url?: string | null;
    date?: { start: string } | null;
    relation?: Array<{ id: string }>;
};

function isPageObject(item: any): item is PageObjectResponse {
    return 'properties' in item;
}

function normalizeProps(properties: Record<string, any>): Record<string, NotionProp> {
    const normalized: Record<string, NotionProp> = {};
    for (const [key, value] of Object.entries(properties)) {
        normalized[key.toLowerCase()] = value;
    }
    return normalized;
}

/** Fetch all pages from a Notion database, handling pagination. */
async function fetchAllPages(databaseId: string): Promise<PageObjectResponse[]> {
    const pages: PageObjectResponse[] = [];
    let startCursor: string | undefined;

    do {
        const response: any = await notion.databases.query({
            database_id: databaseId,
            start_cursor: startCursor,
            page_size: 100,
        });

        for (const page of response.results) {
            if (isPageObject(page)) {
                pages.push(page);
            }
        }

        startCursor = response.has_more ? response.next_cursor : undefined;
    } while (startCursor);

    return pages;
}

// --- Turso setup ---

const db = drizzle({
    connection: {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
    },
    schema,
});

// --- Migration functions ---

async function migrateProjects() {
    const dbId = process.env.NOTION_PROJECTS_DB_ID;
    if (!dbId) { console.log('Skipping projects — NOTION_PROJECTS_DB_ID not set'); return; }

    const pages = await fetchAllPages(dbId);
    console.log(`Migrating ${pages.length} projects...`);

    for (const page of pages) {
        const props = normalizeProps(page.properties);
        const platform = props.platform?.select?.name?.toLowerCase() || null;
        const platformAccountId = props['platform account id']?.rich_text?.[0]?.plain_text || null;

        await db.insert(schema.projects).values({
            id: page.id,
            name: props.name?.title?.[0]?.plain_text || '',
            type: (props.type?.select?.name || '').toLowerCase(),
            status: (props.status?.select?.name || 'active').toLowerCase(),
            platform,
            platformAccountId,
            link: props.link?.url || null,
        }).onConflictDoNothing();
    }

    console.log(`  Done — ${pages.length} projects.`);
}

async function migrateRevenue() {
    const dbId = process.env.NOTION_REVENUE_DB_ID;
    if (!dbId) { console.log('Skipping revenue — NOTION_REVENUE_DB_ID not set'); return; }

    const pages = await fetchAllPages(dbId);
    console.log(`Migrating ${pages.length} revenue entries...`);

    for (const page of pages) {
        const props = normalizeProps(page.properties);
        const relations = props.projects?.relation as Array<{ id: string }> | undefined;
        if (!relations || relations.length === 0) continue;

        for (const rel of relations) {
            await db.insert(schema.revenue).values({
                id: `${page.id}-${rel.id}`,
                projectId: rel.id,
                amount: props.amount?.number || 0,
                note: props.name?.title?.[0]?.plain_text || null,
            }).onConflictDoNothing();
        }
    }

    console.log(`  Done — ${pages.length} revenue entries.`);
}

async function migrateCosts() {
    const dbId = process.env.NOTION_COSTS_DB_ID;
    if (!dbId) { console.log('Skipping costs — NOTION_COSTS_DB_ID not set'); return; }

    const pages = await fetchAllPages(dbId);
    console.log(`Migrating ${pages.length} cost entries...`);

    for (const page of pages) {
        const props = normalizeProps(page.properties);
        const relations = props.projects?.relation as Array<{ id: string }> | undefined;
        if (!relations || relations.length === 0) continue;

        for (const rel of relations) {
            await db.insert(schema.costs).values({
                id: `${page.id}-${rel.id}`,
                projectId: rel.id,
                amount: props.amount?.number || 0,
                note: props.name?.title?.[0]?.plain_text || null,
            }).onConflictDoNothing();
        }
    }

    console.log(`  Done — ${pages.length} cost entries.`);
}

async function migrateMetrics() {
    const dbId = process.env.NOTION_METRICS_DB_ID;
    if (!dbId) { console.log('Skipping metrics — NOTION_METRICS_DB_ID not set'); return; }

    const pages = await fetchAllPages(dbId);
    console.log(`Migrating ${pages.length} metrics...`);

    for (const page of pages) {
        const props = normalizeProps(page.properties);
        const name = props.name?.title?.[0]?.plain_text || '';
        const value = props.value?.number || 0;
        const relations = props.projects?.relation as Array<{ id: string }> | undefined;
        if (!relations || relations.length === 0 || !name) continue;

        for (const rel of relations) {
            await db.insert(schema.metrics).values({
                id: `${page.id}-${rel.id}`,
                projectId: rel.id,
                name,
                value,
            }).onConflictDoNothing();
        }
    }

    console.log(`  Done — ${pages.length} metrics.`);
}

async function migrateStreams() {
    const dbId = process.env.NOTION_STREAMS_DB_ID;
    if (!dbId) { console.log('Skipping streams — NOTION_STREAMS_DB_ID not set'); return; }

    const pages = await fetchAllPages(dbId);
    console.log(`Migrating ${pages.length} streams...`);

    let totalCommits = 0;

    for (const page of pages) {
        const props = normalizeProps(page.properties);
        const videoId = (props.videoid?.rich_text || []).map(t => t.plain_text).join('');
        if (!videoId) continue;

        const streamId = page.id;

        await db.insert(schema.streams).values({
            id: streamId,
            name: props.name?.title?.[0]?.plain_text || '',
            videoId,
            actualStartTime: props.actualstarttime?.date?.start || null,
            actualEndTime: props.actualendtime?.date?.start || null,
            thumbnailUrl: props.thumbnailurl?.url || null,
            viewCount: props.viewcount?.number || 0,
            likeCount: props.likecount?.number || 0,
            commentCount: props.commentcount?.number || 0,
            duration: (props.duration?.rich_text || []).map(t => t.plain_text).join('') || null,
        }).onConflictDoNothing();

        // Project relations
        const relationIds = props.projects?.relation?.map(r => r.id) || [];
        for (const projectId of relationIds) {
            await db.insert(schema.streamProjects).values({
                streamId,
                projectId,
            }).onConflictDoNothing();
        }

        // Parse commits from JSON blob
        const commitsJson = (props.commits?.rich_text || []).map(t => t.plain_text).join('');
        if (commitsJson) {
            try {
                const commits = JSON.parse(commitsJson);
                if (Array.isArray(commits)) {
                    for (const c of commits) {
                        await db.insert(schema.streamCommits).values({
                            streamId,
                            sha: c.sha || '',
                            message: c.message || null,
                            author: c.author || null,
                            timestamp: c.timestamp || null,
                            htmlUrl: c.htmlUrl || null,
                            repo: c.repo || null,
                            projectId: c.projectId || null,
                        });
                        totalCommits++;
                    }
                }
            } catch { /* ignore parse errors */ }
        }
    }

    console.log(`  Done — ${pages.length} streams, ${totalCommits} commits.`);
}

async function migrateActivity() {
    const dbId = process.env.NOTION_ACTIVITY_DB_ID;
    if (!dbId) { console.log('Skipping activity — NOTION_ACTIVITY_DB_ID not set'); return; }

    const pages = await fetchAllPages(dbId);
    console.log(`Migrating ${pages.length} activity events...`);

    for (const page of pages) {
        const props = normalizeProps(page.properties);
        const payloadJson = (props.payload?.rich_text || []).map(t => t.plain_text).join('');
        const externalId = (props.externalid?.rich_text || []).map(t => t.plain_text).join('');
        if (!externalId || !payloadJson) continue;

        await db.insert(schema.activityEvents).values({
            id: page.id,
            type: props.type?.select?.name || '',
            timestamp: props.timestamp?.date?.start || '',
            projectId: (props.projectid?.rich_text || []).map(t => t.plain_text).join('') || null,
            projectName: (props.projectname?.rich_text || []).map(t => t.plain_text).join('') || null,
            externalId,
            payload: payloadJson,
        }).onConflictDoNothing();
    }

    console.log(`  Done — ${pages.length} activity events.`);
}

// --- Main ---

async function main() {
    console.log('Starting Notion → Turso migration...\n');

    await migrateProjects();
    await migrateRevenue();
    await migrateCosts();
    await migrateMetrics();
    await migrateStreams();
    await migrateActivity();

    console.log('\nMigration complete!');
}

main().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
