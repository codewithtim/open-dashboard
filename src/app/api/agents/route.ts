import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { agents as agentsTable } from '@/lib/db/schema';
import { requireAgentAuth } from './_lib/auth';
import { CreateAgentBody } from '@/lib/api/generated/agent-api';

export async function GET(request: Request) {
    const authError = requireAgentAuth(request);
    if (authError) return authError;

    const db = getDb();
    const rows = await db.select().from(agentsTable);

    return NextResponse.json(rows.map(row => ({
        id: row.id,
        name: row.name,
        identifier: row.identifier,
        description: row.description || null,
        companyId: row.companyId || null,
        status: row.status,
        currentTask: row.currentTask || null,
        lastSeenAt: row.lastSeenAt || null,
        createdAt: row.createdAt,
    })));
}

export async function POST(request: Request) {
    const authError = requireAgentAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const parsed = CreateAgentBody.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, identifier, description, companyId } = parsed.data;

    const db = getDb();

    const existing = await db.select({ id: agentsTable.id })
        .from(agentsTable)
        .where(eq(agentsTable.identifier, identifier));
    if (existing.length > 0) {
        return NextResponse.json({ error: 'Identifier already exists' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const id = `agt_${crypto.randomUUID()}`;

    await db.insert(agentsTable).values({
        id,
        name,
        identifier,
        description: description || null,
        companyId: companyId || null,
        status: 'idle',
        lastSeenAt: now,
        createdAt: now,
    });

    return NextResponse.json({
        id,
        name,
        identifier,
        description: description || null,
        companyId: companyId || null,
        status: 'idle',
        currentTask: null,
        lastSeenAt: now,
        createdAt: now,
    }, { status: 201 });
}
