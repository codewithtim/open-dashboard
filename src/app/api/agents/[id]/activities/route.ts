import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { agents as agentsTable, agentActivities as agentActivitiesTable } from '@/lib/db/schema';
import { requireAgentAuth } from '../../_lib/auth';
import { LogAgentActivityBody } from '@/lib/api/generated/agent-api';
import { randomUUID } from 'crypto';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const authError = requireAgentAuth(request);
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const parsed = LogAgentActivityBody.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const db = getDb();

    const existing = await db.select().from(agentsTable).where(eq(agentsTable.id, id));
    if (existing.length === 0) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const externalId = `agent_activity:${id}:${randomUUID()}`;

    const result = await db.insert(agentActivitiesTable).values({
        agentId: id,
        action: parsed.data.action,
        description: parsed.data.description ?? null,
        metadata: parsed.data.metadata ?? null,
        timestamp: now,
        externalId,
    }).returning();

    const activity = result[0];

    return NextResponse.json({
        id: activity.id,
        agentId: activity.agentId,
        action: activity.action,
        description: activity.description,
        metadata: activity.metadata,
        timestamp: activity.timestamp,
    }, { status: 201 });
}
