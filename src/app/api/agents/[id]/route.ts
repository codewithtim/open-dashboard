import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { agents as agentsTable, agentRepos, agentProjects } from '@/lib/db/schema';
import { requireAgentAuth } from '../_lib/auth';
import { UpdateAgentBody } from '@/lib/api/generated/agent-api';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const authError = requireAgentAuth(request);
    if (authError) return authError;

    const { id } = await params;
    const db = getDb();

    const rows = await db.select().from(agentsTable).where(eq(agentsTable.id, id));
    if (rows.length === 0) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = rows[0];

    const repoRows = await db.select().from(agentRepos).where(eq(agentRepos.agentId, id));
    const projectRows = await db.select().from(agentProjects).where(eq(agentProjects.agentId, id));

    return NextResponse.json({
        id: agent.id,
        name: agent.name,
        identifier: agent.identifier,
        description: agent.description || null,
        companyId: agent.companyId || null,
        status: agent.status,
        currentTask: agent.currentTask || null,
        lastSeenAt: agent.lastSeenAt || null,
        createdAt: agent.createdAt,
        repos: repoRows.map(r => r.repoFullName),
        projectIds: projectRows.map(r => r.projectId),
    });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const authError = requireAgentAuth(request);
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateAgentBody.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const db = getDb();

    const existing = await db.select().from(agentsTable).where(eq(agentsTable.id, id));
    if (existing.length === 0) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const updates: Record<string, any> = { lastSeenAt: new Date().toISOString() };
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.description !== undefined) updates.description = parsed.data.description;
    if ('companyId' in parsed.data) updates.companyId = parsed.data.companyId ?? null;
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;
    if ('currentTask' in parsed.data) updates.currentTask = parsed.data.currentTask ?? null;

    await db.update(agentsTable).set(updates).where(eq(agentsTable.id, id));

    const updated = await db.select().from(agentsTable).where(eq(agentsTable.id, id));
    const agent = updated[0];

    return NextResponse.json({
        id: agent.id,
        name: agent.name,
        identifier: agent.identifier,
        description: agent.description || null,
        companyId: agent.companyId || null,
        status: agent.status,
        currentTask: agent.currentTask || null,
        lastSeenAt: agent.lastSeenAt || null,
        createdAt: agent.createdAt,
    });
}
