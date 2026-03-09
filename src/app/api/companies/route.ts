import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { companies as companiesTable } from '@/lib/db/schema';
import { requireAgentAuth } from '../agents/_lib/auth';
import { CreateCompanyBody } from '@/lib/api/generated/agent-api';

export async function GET(request: Request) {
    const authError = requireAgentAuth(request);
    if (authError) return authError;

    const db = getDb();
    const rows = await db.select().from(companiesTable);

    return NextResponse.json(rows.map(row => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        website: row.website || null,
        description: row.description || null,
        logoUrl: row.logoUrl || null,
        parentId: row.parentId || null,
        createdAt: row.createdAt,
    })));
}

export async function POST(request: Request) {
    const authError = requireAgentAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const parsed = CreateCompanyBody.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, slug, website, description, logoUrl, parentId } = parsed.data;

    const db = getDb();

    const existing = await db.select({ id: companiesTable.id })
        .from(companiesTable)
        .where(eq(companiesTable.slug, slug));
    if (existing.length > 0) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }

    if (parentId) {
        const parent = await db.select({ id: companiesTable.id })
            .from(companiesTable)
            .where(eq(companiesTable.id, parentId));
        if (parent.length === 0) {
            return NextResponse.json({ error: 'Parent company not found' }, { status: 400 });
        }
    }

    const now = new Date().toISOString();
    const id = `comp_${crypto.randomUUID()}`;

    await db.insert(companiesTable).values({
        id,
        name,
        slug,
        website: website || null,
        description: description || null,
        logoUrl: logoUrl || null,
        parentId: parentId || null,
        createdAt: now,
    });

    return NextResponse.json({
        id,
        name,
        slug,
        website: website || null,
        description: description || null,
        logoUrl: logoUrl || null,
        parentId: parentId || null,
        createdAt: now,
    }, { status: 201 });
}
