import { getDataClient } from '@/lib/client-factory';
import { AgentDashboard } from '@/components/agent-dashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: '1H:NAI | Tim Knight',
    description: 'AI agent activity — autonomous commits across repos.',
};

export default async function OneHumanNAIPage() {
    const client = getDataClient();
    const [companies, agents, commits, activities] = await Promise.all([
        client.getCompanies(),
        client.getAgents(),
        client.getAgentCommits(100),
        client.getAgentActivities(100),
    ]);

    return (
        <main className="min-h-[60vh] flex flex-col items-center pt-12 space-y-6">
            <AgentDashboard
                initialCompanies={companies}
                initialAgents={agents}
                initialCommits={commits}
                initialActivities={activities}
            />
        </main>
    );
}
