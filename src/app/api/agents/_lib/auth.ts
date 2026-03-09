import { NextResponse } from 'next/server';

export function requireAgentAuth(request: Request): NextResponse | null {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.AGENT_API_KEY}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return null;
}
