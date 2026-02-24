import { getDataClient } from '@/lib/client-factory';
import { DashboardCard } from '@/components/dashboard-card';
import { ProgressBar } from '@/components/progress-bar';
import React from 'react';
import { FaYoutube, FaTiktok, FaLaptopCode } from 'react-icons/fa6';
import { FaXTwitter } from 'react-icons/fa6';
import { BsBoxSeam } from 'react-icons/bs';
import { ChevronDown } from 'lucide-react';

function getProjectIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes('youtube')) return <FaYoutube className="w-5 h-5 text-[#FF0000]" />;
  if (t.includes('saas') || t.includes('software')) return <FaLaptopCode className="w-5 h-5 text-blue-500" />;
  if (t.includes('tiktok') || t.includes('video')) return <FaTiktok className="w-5 h-5 text-black dark:text-white" />;
  if (t.includes('twitter') || t.includes('x')) return <FaXTwitter className="w-5 h-5 text-black dark:text-white" />;
  return <BsBoxSeam className="w-5 h-5 text-indigo-500" />;
}

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
        <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Active Projects</h2>
        <div className="space-y-4">
          {detailedProjects.map((p) => (
            <details key={p.id} className="group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm hover:border-indigo-500/30 dark:hover:border-indigo-400/30 transition-all overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="p-5 flex justify-between items-center cursor-pointer select-none">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg group-hover:scale-105 transition-transform">
                    {getProjectIcon(p.type)}
                  </div>
                  <div>
                    <h3 className="font-medium text-lg text-neutral-900 dark:text-white">{p.name}</h3>
                    <p className="text-sm text-neutral-500 capitalize mt-1 border-b border-transparent">{p.type}</p>
                  </div>
                </div>

                <div className="flex items-center gap-8 text-sm">
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-neutral-500 text-xs uppercase tracking-wider">Revenue</span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">${p.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-neutral-500 text-xs uppercase tracking-wider">Profit</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">${p.netProfit.toLocaleString()}</span>
                  </div>

                  <ChevronDown className="w-5 h-5 text-neutral-400 transition-transform duration-300 group-open:-rotate-180" />
                </div>
              </summary>

              <div className="px-5 pb-5 pt-2 border-t border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-wider text-neutral-500">Total Costs</span>
                    <span className="text-lg font-medium text-red-500 dark:text-red-400">${p.totalCosts.toLocaleString()}</span>
                  </div>

                  {p.metrics.map((m, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <span className="text-xs uppercase tracking-wider text-neutral-500">{m.name}</span>
                      <span className="text-lg font-medium text-neutral-900 dark:text-neutral-100">{m.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
