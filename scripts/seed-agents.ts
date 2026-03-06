/**
 * Seed script: inserts agents and their tracked repos into Turso.
 *
 * Usage:
 *   npx ts-node scripts/seed-agents.ts
 *
 * Required env vars:
 *   TURSO_DATABASE_URL, TURSO_AUTH_TOKEN
 *
 * Idempotent — uses ON CONFLICT DO NOTHING, safe to re-run.
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../src/lib/db/schema';

const db = drizzle({
    connection: {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
    },
    schema,
});

// ─── Define agents and their repos here ───────────────────────────────────────

interface AgentSeed {
    id: string;
    name: string;
    identifier: string;  // Must match the git commit author name
    description: string;
    repos: string[];      // e.g. "owner/repo"
}

const agentSeeds: AgentSeed[] = [
    {
        id: 'agent-operator',
        name: 'Operator',
        identifier: 'Operator',
        description: 'OpenClaw autonomous coding agent',
        repos: [
            'codewithtim/insider_trading_tracker',
        ],
    },
    // Add more agents here:
    // {
    //     id: 'agent-devin',
    //     name: 'Devin',
    //     identifier: 'devin-ai[bot]',
    //     description: 'Devin AI software engineer',
    //     repos: ['codewithtim/some-repo'],
    // },
];

// ─── Seed logic ───────────────────────────────────────────────────────────────

async function seed() {
    const now = new Date().toISOString();

    for (const agent of agentSeeds) {
        await db.insert(schema.agents).values({
            id: agent.id,
            name: agent.name,
            identifier: agent.identifier,
            description: agent.description,
            createdAt: now,
        }).onConflictDoNothing();

        console.log(`Agent: ${agent.name} (identifier: "${agent.identifier}")`);

        for (const repo of agent.repos) {
            await db.insert(schema.agentRepos).values({
                agentId: agent.id,
                repoFullName: repo,
            }).onConflictDoNothing();

            console.log(`  └─ repo: ${repo}`);
        }
    }

    console.log('\nDone. Seeded %d agent(s).', agentSeeds.length);
}

seed().catch(console.error);
