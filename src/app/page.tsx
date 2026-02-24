import { getDataClient } from '@/lib/client-factory';
import { DashboardCard } from '@/components/dashboard-card';
import { ProgressBar } from '@/components/progress-bar';
import React from 'react';
import { renderProjectRow } from '@/components/project-rows';

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

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard title="Total Subscribers" value={stats.totalSubscribers.toLocaleString()} />
        <DashboardCard title="Total Views" value={stats.totalViews.toLocaleString()} />
        <DashboardCard title="Active Users" value={stats.totalActiveUsers.toLocaleString()} />
      </section>

      <section>
        <h2 className="text-xl font-bold mb-5 text-[#2B3674] dark:text-white tracking-tight">Active Projects</h2>
        <div className="space-y-4">
          {detailedProjects.map((p) => renderProjectRow(p))}
        </div>
      </section>
    </main>
  );
}
