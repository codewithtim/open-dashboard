import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { agents as agentsTable, agentRepos } from '@/lib/db/schema';
import { requireAgentAuth } from '../../_lib/auth';
import { SetAgentReposBody } from '@/lib/api/generated/agent-api';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const authError = requireAgentAuth(request);
    if (authError) return authError;

    const { id } = await params;
    const db = getDb();

    const rows = await db.select().from(agentRepos).where(eq(agentRepos.agentId, id));
    return NextResponse.json({ repos: rows.map(r => r.repoFullName) });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const authError = requireAgentAuth(request);
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const parsed = SetAgentReposBody.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const db = getDb();

    const existing = await db.select({ id: agentsTable.id }).from(agentsTable).where(eq(agentsTable.id, id));
    if (existing.length === 0) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    await db.delete(agentRepos).where(eq(agentRepos.agentId, id));

    if (parsed.data.repos.length > 0) {
        await db.insert(agentRepos).values(
            parsed.data.repos.map(repo => ({ agentId: id, repoFullName: repo }))
        );
    }

    await db.update(agentsTable).set({ lastSeenAt: new Date().toISOString() }).where(eq(agentsTable.id, id));

    return NextResponse.json({ repos: parsed.data.repos });
}
