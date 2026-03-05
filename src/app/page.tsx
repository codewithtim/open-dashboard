import { getDataClient } from '@/lib/client-factory';
import { ProgressBar } from '@/components/progress-bar';
import { ProjectsTable } from '@/components/projects-table';
import { ActivityFeed } from '@/components/activity-feed';

export default async function DashboardPage() {
  const client = getDataClient();
  const [stats, lightweightProjects, activityEvents] = await Promise.all([
    client.getAggregatedDashboardStats(),
    client.getProjects(),
    client.getRecentActivity(15),
  ]);
  const activeIds = lightweightProjects.map(p => p.id);
  const detailedProjects = await client.getMultipleProjectDetails(activeIds);

  return (
    <main className="min-h-screen py-10 px-4 flex flex-col items-center relative overflow-hidden">
      {/* Hero Header */}
      <section className="z-10 mb-6 mt-4 w-full max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
          Building In <span className="text-accent">Public</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl">
          Pushing the boundaries of what&apos;s possible building with AI — exploring new tools, shipping real products, and sharing every step of the journey.
        </p>
      </section>

      {/* Progress Bar */}
      <section className="w-full max-w-5xl mx-auto z-10 mb-8">
        <ProgressBar currentValue={stats.totalRevenue} />
      </section>

      {/* Stat Cards */}
      <section className="w-full max-w-5xl mx-auto z-10 mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-raised border border-surface-border rounded-2xl p-5">
          <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-1">Total Revenue</p>
          <p className="text-white text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-surface-raised border border-surface-border rounded-2xl p-5">
          <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-1">Net Profit</p>
          <p className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${stats.netProfit.toLocaleString()}
          </p>
        </div>
        <div className="bg-surface-raised border border-surface-border rounded-2xl p-5">
          <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-1">Subscribers</p>
          <p className="text-white text-2xl font-bold">{stats.totalSubscribers.toLocaleString()}</p>
        </div>
        <div className="bg-surface-raised border border-surface-border rounded-2xl p-5">
          <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-1">Views</p>
          <p className="text-white text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
        </div>
      </section>

      {/* Activity Feed */}
      {activityEvents.length > 0 && (
        <section className="w-full max-w-5xl mx-auto z-10 mb-8">
          <ActivityFeed events={activityEvents} />
        </section>
      )}

      {/* Projects Table */}
      <section className="w-full max-w-5xl mx-auto z-10">
        <ProjectsTable projects={detailedProjects} />
      </section>
    </main>
  );
}
