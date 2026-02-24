import { getDataClient } from '@/lib/client-factory';
import { DashboardCard } from '@/components/dashboard-card';
import { ProgressBar } from '@/components/progress-bar';
import React from 'react';
import { FaYoutube, FaTiktok, FaLaptopCode } from 'react-icons/fa6';
import { FaXTwitter } from 'react-icons/fa6';
import { BsBoxSeam } from 'react-icons/bs';
import { ChevronDown } from 'lucide-react';

function getProjectIcon(platform?: string) {
  if (!platform) return <BsBoxSeam className="w-5 h-5 text-[#4318FF]" />;

  const p = platform.toLowerCase();

  if (p.includes('youtube')) return <FaYoutube className="w-6 h-6 text-[#FF0000]" />;
  if (p.includes('saas') || p.includes('software')) return <FaLaptopCode className="w-5 h-5 text-[#4318FF]" />;
  if (p.includes('tiktok') || p.includes('video')) return <FaTiktok className="w-5 h-5 text-[#2B3674] dark:text-white" />;
  if (p.includes('twitter') || p.includes('x')) return <FaXTwitter className="w-5 h-5 text-[#2B3674] dark:text-white" />;

  return <BsBoxSeam className="w-5 h-5 text-[#4318FF]" />;
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
        <h2 className="text-xl font-bold mb-5 text-[#2B3674] dark:text-white tracking-tight">Active Projects</h2>
        <div className="space-y-4">
          {detailedProjects.map((p) => (
            <details key={p.id} className="group bg-white dark:bg-[#111C44] rounded-[20px] shadow-[0_18px_40px_-12px_rgba(112,144,176,0.12)] hover:shadow-[0_20px_45px_-10px_rgba(112,144,176,0.2)] dark:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.5)] transition-all duration-300 overflow-hidden [&_summary::-webkit-details-marker]:hidden font-sans cursor-pointer select-none">
              <summary className="p-6 flex justify-between items-center outline-none">
                <div className="flex items-center gap-5">
                  <div className="p-3 bg-[#F4F7FE] dark:bg-[#0B1437] rounded-full group-hover:scale-105 transition-transform flex items-center justify-center min-w-12 min-h-12">
                    {getProjectIcon(p.platform)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[#2B3674] dark:text-white mb-0.5">{p.name}</h3>
                    <p className="text-sm font-medium text-[#A3AED0] capitalize">{p.type}</p>
                  </div>
                </div>

                <div className="flex items-center gap-10 text-sm">
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-[#A3AED0] text-xs font-semibold uppercase tracking-wider mb-1">Revenue</span>
                    <span className="font-bold text-[#2B3674] dark:text-white text-base">${p.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-[#A3AED0] text-xs font-semibold uppercase tracking-wider mb-1">Profit</span>
                    <span className="font-bold text-emerald-500 dark:text-emerald-400 text-base">${p.netProfit.toLocaleString()}</span>
                  </div>

                  <ChevronDown className="w-6 h-6 text-[#A3AED0] group-open:-rotate-180 transition-transform duration-300" />
                </div>
              </summary>

              <div className="px-6 pb-6 pt-2 border-t border-[#F4F7FE] dark:border-[#0B1437]/50 bg-white dark:bg-[#111C44]">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#A3AED0]">Total Costs</span>
                    <span className="text-xl font-bold text-rose-500 dark:text-rose-400">${p.totalCosts.toLocaleString()}</span>
                  </div>

                  {p.metrics.map((m, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#A3AED0]">{m.name}</span>
                      <span className="text-xl font-bold text-[#2B3674] dark:text-white">{m.value.toLocaleString()}</span>
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
