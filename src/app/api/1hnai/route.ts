import { NextResponse } from 'next/server';
import { getDataClient } from '@/lib/client-factory';

export async function GET() {
    const client = getDataClient();
    const [companies, agents, commits] = await Promise.all([
        client.getCompanies(),
        client.getAgents(),
        client.getAgentCommits(100),
    ]);

    return NextResponse.json({ companies, agents, commits });
}
