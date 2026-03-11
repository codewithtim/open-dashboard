'use client';

import { useEffect, useState } from 'react';
import { Bot, GitCommitHorizontal, FolderGit2, Globe, Building2 } from 'lucide-react';
import { AgentCommitFeed } from '@/components/agent-commit-feed';
import type { Company, Agent, AgentCommit } from '@/lib/data-client';

const POLL_INTERVAL = 5 * 60 * 1000;

interface AgentDashboardProps {
    initialCompanies: Company[];
    initialAgents: Agent[];
    initialCommits: AgentCommit[];
}

function AnimatedCount({ target }: { target: number }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (target === 0) return;
        let current = 0;
        const step = Math.max(1, Math.floor(target / 20));
        const interval = setInterval(() => {
            current = Math.min(current + step, target);
            setCount(current);
            if (current >= target) clearInterval(interval);
        }, 50);
        return () => clearInterval(interval);
    }, [target]);

    return <>{count}</>;
}

export function AgentDashboard({ initialCompanies, initialAgents, initialCommits }: AgentDashboardProps) {
    const [companies, setCompanies] = useState(initialCompanies);
    const [agents, setAgents] = useState(initialAgents);
    const [commits, setCommits] = useState(initialCommits);

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/1hnai');
                if (res.ok) {
                    const data = await res.json();
                    setCompanies(data.companies);
                    setAgents(data.agents);
                    setCommits(data.commits);
                }
            } catch {
                // silently ignore polling failures
            }
        }, POLL_INTERVAL);

        return () => clearInterval(interval);
    }, []);

    const uniqueRepos = new Set(commits.map(c => c.repoFullName));
    const topLevelCompanies = companies.filter(c => !c.parentId);

    return (
        <>
            <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                    1 Human, <span className="text-accent"><AnimatedCount target={agents.length} /> AI</span>
                </h1>
                <p className="text-lg text-slate-400 mt-4 max-w-lg">
                    Autonomous AI agents shipping code around the clock.
                </p>
            </div>

            <div className="grid grid-cols-4 gap-4 w-full max-w-2xl">
                <div className="bg-surface-raised border border-surface-border rounded-2xl p-4 text-center">
                    <Building2 className="w-5 h-5 text-accent mx-auto mb-1" />
                    <p className="text-2xl font-bold text-white">{companies.length}</p>
                    <p className="text-xs text-slate-500">Companies</p>
                </div>
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

            {topLevelCompanies.length > 0 && (
                <div className="w-full max-w-2xl space-y-4">
                    {topLevelCompanies.map((company) => {
                        const childCompanies = companies.filter(c => c.parentId === company.id);
                        const companyAgents = agents.filter(a => a.companyId === company.id);
                        return (
                            <div key={company.id} className="bg-surface-raised border border-surface-border rounded-2xl p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <Building2 className="w-5 h-5 text-accent" />
                                    <h2 className="text-white text-lg font-semibold">{company.name}</h2>
                                    {company.website && (
                                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-accent/60 hover:text-accent">
                                            <Globe className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                                {company.description && (
                                    <p className="text-sm text-slate-400 mb-3">{company.description}</p>
                                )}
                                {companyAgents.length > 0 && (
                                    <div className="space-y-2 mb-3">
                                        {companyAgents.map((agent) => (
                                            <div key={agent.id} className="flex items-center gap-3">
                                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                                    agent.status === 'working' ? 'bg-accent' :
                                                    agent.status === 'offline' ? 'bg-red-400' :
                                                    'bg-slate-500'
                                                }`} />
                                                <span className="text-white text-sm font-medium">{agent.name}</span>
                                                {agent.model && (
                                                        <span className="text-xs text-slate-600">{agent.model}</span>
                                                    )}
                                                    <span className="text-xs text-slate-500">{agent.status}</span>
                                                {agent.currentTask && (
                                                    <span className="text-xs text-slate-400 truncate">&mdash; {agent.currentTask}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {childCompanies.length > 0 && (
                                    <div className="border-t border-surface-border pt-3 mt-3">
                                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Sub-companies</p>
                                        <div className="space-y-2">
                                            {childCompanies.map((child) => (
                                                <div key={child.id} className="flex items-center gap-2">
                                                    <span className="text-sm text-white">{child.name}</span>
                                                    {child.website && (
                                                        <a href={child.website} target="_blank" rel="noopener noreferrer" className="text-accent/60 hover:text-accent">
                                                            <Globe className="w-3 h-3" />
                                                        </a>
                                                    )}
                                                    {child.description && (
                                                        <span className="text-xs text-slate-500 truncate">&mdash; {child.description}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {agents.filter(a => !a.companyId).length > 0 && (
                <div className="w-full max-w-2xl">
                    <div className="bg-surface-raised border border-surface-border rounded-2xl p-5">
                        <h2 className="text-white text-lg font-semibold mb-3">Independent Agents</h2>
                        <div className="space-y-2">
                            {agents.filter(a => !a.companyId).map((agent) => (
                                <div key={agent.id} className="flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                        agent.status === 'working' ? 'bg-accent' :
                                        agent.status === 'offline' ? 'bg-red-400' :
                                        'bg-slate-500'
                                    }`} />
                                    <span className="text-white text-sm font-medium">{agent.name}</span>
                                    <span className="text-xs text-slate-500">{agent.status}</span>
                                    {agent.currentTask && (
                                        <span className="text-xs text-slate-400 truncate">&mdash; {agent.currentTask}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full max-w-2xl">
                <AgentCommitFeed commits={commits} />
            </div>
        </>
    );
}
