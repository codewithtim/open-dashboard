import { StreamCommit } from '@/lib/data-client';
import { GitCommitHorizontal } from 'lucide-react';

interface StreamCommitGroupProps {
    repo: string;
    commits: StreamCommit[];
}

function formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    });
}

export function StreamCommitGroup({ repo, commits }: StreamCommitGroupProps) {
    return (
        <div className="bg-surface-raised border border-surface-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.08]">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <GitCommitHorizontal size={16} className="text-accent" />
                    {repo}
                    <span className="text-xs font-normal text-slate-500">
                        ({commits.length} {commits.length === 1 ? 'commit' : 'commits'})
                    </span>
                </h3>
            </div>
            <ul className="divide-y divide-white/[0.08]">
                {commits.map((commit) => (
                    <li key={commit.sha} className="px-5 py-3 flex items-start gap-3">
                        <a
                            href={commit.htmlUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-accent hover:underline shrink-0 mt-0.5"
                        >
                            {commit.sha.slice(0, 7)}
                        </a>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">
                                {commit.message.split('\n')[0]}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {commit.author} at {formatTime(commit.timestamp)}
                            </p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
