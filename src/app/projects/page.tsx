import { getDataClient } from '@/lib/client-factory';
import { ProjectTag } from '@/components/project-tag';
import Link from 'next/link';
import React from 'react';

export const metadata = {
    title: 'Projects | Tim Knight',
    description: 'A portfolio of software, SaaS, and content projects.',
};

export default async function ProjectsPage() {
    const client = getDataClient();
    const allProjects = await client.getAllProjects();
    const activeProjects = allProjects.filter(p => p.status === 'active');
    const archivedProjects = allProjects.filter(p => p.status !== 'active');

    const [activeDetails, archivedDetails] = await Promise.all([
        client.getMultipleProjectDetails(activeProjects.map(p => p.id)),
        client.getMultipleProjectDetails(archivedProjects.map(p => p.id)),
    ]);

    return (
        <main className="min-h-[60vh] py-10 space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                    All Projects
                </h1>
                <p className="text-lg text-slate-400 mt-4 max-w-lg">
                    Details and direct links to all active and retired ventures.
                </p>
            </div>

            {activeDetails.length > 0 && (
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeDetails.map((project) => (
                        <Link key={project.id} href={`/projects/${project.id}`}>
                            <div className="group bg-surface-raised border border-surface-border rounded-2xl p-5 hover:border-accent/20 transition-all duration-300">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-lg font-semibold text-white group-hover:text-accent transition-colors">
                                        {project.name}
                                    </h3>
                                    <ProjectTag project={project} />
                                </div>
                                {project.description && (
                                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">{project.description}</p>
                                )}
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="text-white">${project.totalRevenue.toLocaleString()} <span className="text-slate-500">revenue</span></span>
                                    <span className={project.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                        ${project.netProfit.toLocaleString()} <span className="text-slate-500">profit</span>
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </section>
            )}

            {archivedDetails.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold text-white mb-4">Archived</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60">
                        {archivedDetails.map((project) => (
                            <Link key={project.id} href={`/projects/${project.id}`}>
                                <div className="group bg-surface-raised border border-surface-border rounded-2xl p-5 hover:border-accent/20 transition-all duration-300">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-semibold text-white group-hover:text-accent transition-colors">
                                            {project.name}
                                        </h3>
                                        <ProjectTag project={project} />
                                    </div>
                                    {project.description && (
                                        <p className="text-sm text-slate-400 mb-3 line-clamp-2">{project.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="text-white">${project.totalRevenue.toLocaleString()} <span className="text-slate-500">revenue</span></span>
                                        <span className={project.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                            ${project.netProfit.toLocaleString()} <span className="text-slate-500">profit</span>
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}
