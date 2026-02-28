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
        <div className="bg-white dark:bg-[#111C44] rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <GitCommitHorizontal size={16} className="text-purple-500" />
                    {repo}
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                        ({commits.length} {commits.length === 1 ? 'commit' : 'commits'})
                    </span>
                </h3>
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {commits.map((commit) => (
                    <li key={commit.sha} className="px-5 py-3 flex items-start gap-3">
                        <a
                            href={commit.htmlUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-purple-600 dark:text-purple-400 hover:underline shrink-0 mt-0.5"
                        >
                            {commit.sha.slice(0, 7)}
                        </a>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-900 dark:text-white truncate">
                                {commit.message.split('\n')[0]}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {commit.author} at {formatTime(commit.timestamp)}
                            </p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
