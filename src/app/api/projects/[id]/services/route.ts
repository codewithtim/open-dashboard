import { NextResponse } from 'next/server';
import { getDataClient } from '@/lib/client-factory';

interface RouteContext {
    params: Promise<{ id: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
    const { id } = await context.params;
    const client = getDataClient();
    const services = await client.getProjectServices(id);
    return NextResponse.json(services);
}

export async function PUT(req: Request, context: RouteContext) {
    const { id } = await context.params;
    const body = await req.json();

    if (!body.services || !Array.isArray(body.services)) {
        return NextResponse.json({ error: 'services array is required' }, { status: 400 });
    }

    const client = getDataClient();
    await client.updateProjectServices(id, body.services);
    const updated = await client.getProjectServices(id);
    return NextResponse.json(updated);
}
