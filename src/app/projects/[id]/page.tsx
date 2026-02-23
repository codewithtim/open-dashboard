import { getDataClient } from '@/lib/client-factory';
import { DashboardCard } from '@/components/dashboard-card';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import React from 'react';

export const revalidate = 3600;

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const client = getDataClient();
    const project = await client.getProjectDetails(id);

    if (!project) {
        notFound();
    }

    return (
        <main className="space-y-8 animate-in fade-in duration-500">
            <Link href="/" className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
                ← Back to Dashboard
            </Link>

            <header className="pb-6 border-b border-neutral-200 dark:border-neutral-800">
                <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                    {project.name}
                </h1>
                <p className="text-sm text-neutral-500 capitalize mt-1">
                    {project.type} • {project.status}
                </p>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardCard title="Project Revenue" value={`$${project.totalRevenue.toLocaleString()}`} />
                <DashboardCard title="Project Costs" value={`$${project.totalCosts.toLocaleString()}`} />
                <DashboardCard title="Project Profit" value={`$${project.netProfit.toLocaleString()}`} featured />
            </section>

            {project.metrics.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold mb-4 text-neutral-800 dark:text-neutral-200">Key Metrics</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {project.metrics.map((metric) => (
                            <DashboardCard key={metric.name} title={metric.name} value={metric.value.toLocaleString()} />
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}
