import { NextResponse } from 'next/server';
import { eq, inArray } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { agents as agentsTable, agentProjects, projects as projectsTable } from '@/lib/db/schema';
import { requireAgentAuth } from '../../_lib/auth';
import { SetAgentProjectsBody } from '@/lib/api/generated/agent-api';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const authError = requireAgentAuth(request);
    if (authError) return authError;

    const { id } = await params;
    const db = getDb();

    const rows = await db.select().from(agentProjects).where(eq(agentProjects.agentId, id));
    return NextResponse.json({ projectIds: rows.map(r => r.projectId) });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const authError = requireAgentAuth(request);
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const parsed = SetAgentProjectsBody.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const db = getDb();

    const existingAgent = await db.select({ id: agentsTable.id }).from(agentsTable).where(eq(agentsTable.id, id));
    if (existingAgent.length === 0) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    if (parsed.data.projectIds.length > 0) {
        const existingProjects = await db.select({ id: projectsTable.id })
            .from(projectsTable)
            .where(inArray(projectsTable.id, parsed.data.projectIds));
        const foundIds = new Set(existingProjects.map(p => p.id));
        const missing = parsed.data.projectIds.filter(id => !foundIds.has(id));
        if (missing.length > 0) {
            return NextResponse.json({ error: `Projects not found: ${missing.join(', ')}` }, { status: 400 });
        }
    }

    await db.delete(agentProjects).where(eq(agentProjects.agentId, id));

    if (parsed.data.projectIds.length > 0) {
        await db.insert(agentProjects).values(
            parsed.data.projectIds.map(projectId => ({ agentId: id, projectId }))
        );
    }

    await db.update(agentsTable).set({ lastSeenAt: new Date().toISOString() }).where(eq(agentsTable.id, id));

    return NextResponse.json({ projectIds: parsed.data.projectIds });
}
