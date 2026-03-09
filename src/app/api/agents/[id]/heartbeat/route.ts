import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { agents as agentsTable } from '@/lib/db/schema';
import { requireAgentAuth } from '../../_lib/auth';
import { HeartbeatBody } from '@/lib/api/generated/agent-api';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const authError = requireAgentAuth(request);
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const parsed = HeartbeatBody.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const db = getDb();

    const existing = await db.select().from(agentsTable).where(eq(agentsTable.id, id));
    if (existing.length === 0) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const updates: Record<string, any> = { lastSeenAt: now };
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;
    if ('currentTask' in parsed.data) updates.currentTask = parsed.data.currentTask ?? null;

    await db.update(agentsTable).set(updates).where(eq(agentsTable.id, id));

    const updated = await db.select().from(agentsTable).where(eq(agentsTable.id, id));
    const agent = updated[0];

    return NextResponse.json({
        id: agent.id,
        status: agent.status,
        currentTask: agent.currentTask || null,
        lastSeenAt: agent.lastSeenAt,
    });
}
