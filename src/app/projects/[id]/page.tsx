import { getDataClient } from '@/lib/client-factory';
import { ProjectTag } from '@/components/project-tag';
import { ActivityFeed } from '@/components/activity-feed';
import { StreamCard } from '@/components/stream-card';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import React from 'react';
import { Project } from '@/lib/data-client';
import { ExternalLink } from 'lucide-react';

interface ProjectDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
    const { id } = await params;
    const client = getDataClient();
    const [project, activity, streams, allProjects] = await Promise.all([
        client.getProjectDetails(id),
        client.getRecentActivity(50),
        client.getStreams(),
        client.getAllProjects(),
    ]);

    if (!project) return notFound();

    const projectMap = new Map<string, Project>(allProjects.map(p => [p.id, p]));
    const projectActivity = activity.filter(e => e.projectId === id);
    const relatedStreams = streams.filter(s => s.projectIds.includes(id));

    return (
        <main className="min-h-[60vh] py-10 space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div>
                <Link href="/projects" className="text-sm text-slate-500 hover:text-accent transition-colors">
                    &larr; All Projects
                </Link>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mt-2">
                    {project.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                    <ProjectTag project={project} />
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white/[0.05] text-slate-300 capitalize">
                        {project.type}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full ${
                        project.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-white/[0.05] text-slate-500'
                    }`}>
                        {project.status}
                    </span>
                </div>
                {project.description && (
                    <p className="text-slate-400 mt-3 max-w-2xl">{project.description}</p>
                )}
                {project.link && (
                    <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent/80 mt-2 transition-colors"
                    >
                        <ExternalLink size={14} />
                        Visit project
                    </a>
                )}
            </div>

            {/* Financials */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface-raised border border-surface-border rounded-2xl p-5">
                    <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-1">Revenue</p>
                    <p className="text-white text-2xl font-bold">${project.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-surface-raised border border-surface-border rounded-2xl p-5">
                    <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-1">Costs</p>
                    <p className="text-rose-400 text-2xl font-bold">${project.totalCosts.toLocaleString()}</p>
                </div>
                <div className="bg-surface-raised border border-surface-border rounded-2xl p-5">
                    <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-1">Profit</p>
                    <p className={`text-2xl font-bold ${project.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ${project.netProfit.toLocaleString()}
                    </p>
                </div>
            </section>

            {/* Metrics */}
            {project.metrics.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold text-white mb-4">Metrics</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {project.metrics.map((metric) => (
                            <div key={metric.name} className="bg-surface-raised border border-surface-border rounded-2xl p-5">
                                <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-1">{metric.name}</p>
                                <p className="text-white text-2xl font-bold">{metric.value.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Activity */}
            {projectActivity.length > 0 && (
                <section>
                    <ActivityFeed events={projectActivity} />
                </section>
            )}

            {/* Related Streams */}
            {relatedStreams.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold text-white mb-4">Related Streams</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {relatedStreams.map((stream) => {
                            const streamProjects = stream.projectIds
                                .map(pid => projectMap.get(pid))
                                .filter((p): p is Project => p !== undefined);
                            return (
                                <StreamCard key={stream.id} stream={stream} projects={streamProjects} />
                            );
                        })}
                    </div>
                </section>
            )}
        </main>
    );
}
