import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { companies as companiesTable, agents as agentsTable } from '@/lib/db/schema';
import { requireAgentAuth } from '../../agents/_lib/auth';
import { UpdateCompanyBody } from '@/lib/api/generated/agent-api';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const authError = requireAgentAuth(request);
    if (authError) return authError;

    const { id } = await params;
    const db = getDb();

    const rows = await db.select().from(companiesTable).where(eq(companiesTable.id, id));
    if (rows.length === 0) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const company = rows[0];
    const children = await db.select().from(companiesTable).where(eq(companiesTable.parentId, id));
    const agents = await db.select().from(agentsTable).where(eq(agentsTable.companyId, id));

    return NextResponse.json({
        id: company.id,
        name: company.name,
        slug: company.slug,
        website: company.website || null,
        description: company.description || null,
        logoUrl: company.logoUrl || null,
        parentId: company.parentId || null,
        createdAt: company.createdAt,
        children: children.map(c => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            website: c.website || null,
            description: c.description || null,
            logoUrl: c.logoUrl || null,
            parentId: c.parentId || null,
            createdAt: c.createdAt,
        })),
        agents: agents.map(a => ({
            id: a.id,
            name: a.name,
            identifier: a.identifier,
            description: a.description || null,
            companyId: a.companyId || null,
            status: a.status,
            currentTask: a.currentTask || null,
            lastSeenAt: a.lastSeenAt || null,
            createdAt: a.createdAt,
        })),
    });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const authError = requireAgentAuth(request);
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateCompanyBody.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const db = getDb();

    const existing = await db.select().from(companiesTable).where(eq(companiesTable.id, id));
    if (existing.length === 0) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const updates: Record<string, any> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.website !== undefined) updates.website = parsed.data.website;
    if (parsed.data.description !== undefined) updates.description = parsed.data.description;
    if (parsed.data.logoUrl !== undefined) updates.logoUrl = parsed.data.logoUrl;
    if ('parentId' in parsed.data) updates.parentId = parsed.data.parentId ?? null;

    if (Object.keys(updates).length > 0) {
        await db.update(companiesTable).set(updates).where(eq(companiesTable.id, id));
    }

    const updated = await db.select().from(companiesTable).where(eq(companiesTable.id, id));
    const company = updated[0];

    return NextResponse.json({
        id: company.id,
        name: company.name,
        slug: company.slug,
        website: company.website || null,
        description: company.description || null,
        logoUrl: company.logoUrl || null,
        parentId: company.parentId || null,
        createdAt: company.createdAt,
    });
}
