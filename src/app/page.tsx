import { getDataClient } from '@/lib/client-factory';
import { DashboardCard } from '@/components/dashboard-card';
import { ProgressBar } from '@/components/progress-bar';
import Link from 'next/link';
import React from 'react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const client = getDataClient();
  const stats = await client.getAggregatedDashboardStats();
  const lightweightProjects = await client.getProjects();
  const activeIds = lightweightProjects.map(p => p.id);
  const detailedProjects = await client.getMultipleProjectDetails(activeIds);

  return (
    <main className="space-y-8">
      <section>
        <ProgressBar currentValue={stats.totalRevenue} targetValue={1000000} />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard title="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} />
        <DashboardCard title="Total Costs" value={`$${stats.totalCosts.toLocaleString()}`} />
        <DashboardCard title="Net Profit" value={`$${stats.netProfit.toLocaleString()}`} featured />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-neutral-800 dark:text-neutral-200">Active Projects</h2>
        <div className="space-y-4">
          {detailedProjects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="block p-5 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 shadow-sm hover:shadow hover:border-neutral-300 dark:hover:border-neutral-700 transition flex justify-between items-center group">
              <div>
                <h3 className="font-medium text-lg text-neutral-900 dark:text-white">{p.name}</h3>
                <p className="text-sm text-neutral-500 capitalize mt-1">{p.type}</p>
              </div>

              <div className="hidden md:flex items-center gap-8 text-sm">
                <div className="flex flex-col text-right">
                  <span className="text-neutral-500 text-xs uppercase tracking-wider">Revenue</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">${p.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-neutral-500 text-xs uppercase tracking-wider">Profit</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">${p.netProfit.toLocaleString()}</span>
                </div>

                {p.metrics.slice(0, 2).map((m, idx) => (
                  <div key={idx} className="flex flex-col text-right">
                    <span className="text-neutral-500 text-xs uppercase tracking-wider">{m.name}</span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{m.value.toLocaleString()}</span>
                  </div>
                ))}

                <span className="ml-4 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-900 dark:group-hover:text-white transition transform group-hover:translate-x-1">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
