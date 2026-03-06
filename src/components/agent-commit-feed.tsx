import { Bot } from 'lucide-react';
import { AgentCommit } from '@/lib/data-client';

function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function AgentCommitFeed({ commits }: { commits: AgentCommit[] }) {
    if (commits.length === 0) {
        return (
            <div className="bg-surface-raised border border-surface-border rounded-2xl p-5">
                <p className="text-slate-500 text-sm">No agent commits yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-surface-raised border border-surface-border rounded-2xl p-5">
            <h2 className="text-white text-lg font-semibold mb-4">Agent Commits</h2>
            <div className="space-y-3">
                {commits.map((commit) => {
                    const firstLine = commit.message.split('\n')[0];
                    return (
                        <div key={commit.id} className="flex items-start gap-3">
                            <div className="mt-1 flex-shrink-0">
                                <Bot className="w-4 h-4 text-accent" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-white text-sm truncate">{firstLine}</p>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                    <a
                                        href={commit.htmlUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-mono text-accent/70 hover:text-accent"
                                    >
                                        {commit.sha.slice(0, 7)}
                                    </a>
                                    {commit.agentName && <span className="text-accent/60">{commit.agentName}</span>}
                                    <span className="text-slate-600">{commit.repoFullName}</span>
                                </div>
                            </div>
                            <span className="text-xs text-slate-600 whitespace-nowrap flex-shrink-0 mt-0.5">
                                {timeAgo(commit.timestamp)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
