import { getDataClient } from '@/lib/client-factory';
import { AgentCommitFeed } from '@/components/agent-commit-feed';
import { Bot, GitCommitHorizontal, FolderGit2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: '1H:NAI | Tim Knight',
    description: 'AI agent activity — autonomous commits across repos.',
};

export default async function OneHumanNAIPage() {
    const client = getDataClient();
    const [agents, commits] = await Promise.all([
        client.getAgents(),
        client.getAgentCommits(100),
    ]);

    const uniqueRepos = new Set(commits.map(c => c.repoFullName));

    return (
        <main className="min-h-[60vh] flex flex-col items-center pt-12 space-y-6">
            <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                    1 Human, <span className="text-accent">N AI</span>
                </h1>
                <p className="text-lg text-slate-400 mt-4 max-w-lg">
                    Autonomous AI agents shipping code around the clock.
                </p>
            </div>

            <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
                <div className="bg-surface-raised border border-surface-border rounded-2xl p-4 text-center">
                    <Bot className="w-5 h-5 text-accent mx-auto mb-1" />
                    <p className="text-2xl font-bold text-white">{agents.length}</p>
                    <p className="text-xs text-slate-500">Agents</p>
                </div>
                <div className="bg-surface-raised border border-surface-border rounded-2xl p-4 text-center">
                    <GitCommitHorizontal className="w-5 h-5 text-accent mx-auto mb-1" />
                    <p className="text-2xl font-bold text-white">{commits.length}</p>
                    <p className="text-xs text-slate-500">Commits</p>
                </div>
                <div className="bg-surface-raised border border-surface-border rounded-2xl p-4 text-center">
                    <FolderGit2 className="w-5 h-5 text-accent mx-auto mb-1" />
                    <p className="text-2xl font-bold text-white">{uniqueRepos.size}</p>
                    <p className="text-xs text-slate-500">Repos</p>
                </div>
            </div>

            <div className="w-full max-w-2xl">
                <AgentCommitFeed commits={commits} />
            </div>
        </main>
    );
}
