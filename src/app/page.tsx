import { getDataClient } from '@/lib/client-factory';
import { DashboardCard } from '@/components/dashboard-card';
import React from 'react';
import { renderProjectRow } from '@/components/project-rows';
import { CentralStatsHub } from '@/components/central-stats-hub';
import { NetworkLines } from '@/components/network-lines';
import { NodeIcon } from '@/components/node-icon';
import { FiYoutube, FiTwitter, FiGithub, FiBox } from 'react-icons/fi';

export default async function DashboardPage() {
  const client = getDataClient();
  const [stats, lightweightProjects, tools] = await Promise.all([
    client.getAggregatedDashboardStats(),
    client.getProjects(),
    client.getTools(),
  ]);
  const activeIds = lightweightProjects.map(p => p.id);
  const detailedProjects = await client.getMultipleProjectDetails(activeIds);
  const softwareProjectsCount = detailedProjects.filter(p => p.type === 'software').length;

  return (
    <main className="min-h-screen py-10 px-4 flex flex-col items-center relative overflow-hidden">
      {/* Hero Header */}
      <section className="text-center z-10 mb-2 mt-4 w-full max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
          Building In <span className="text-purple-600 dark:text-purple-400">Public</span>
        </h1>
      </section>

      {/* Network Visualizer Container */}
      <section className="relative w-full max-w-6xl mx-auto min-h-[550px] md:min-h-0 md:h-[450px] flex items-center justify-center my-6 z-10">
        <NetworkLines projects={detailedProjects}>
          <CentralStatsHub stats={stats} softwareProjectsCount={softwareProjectsCount} />
        </NetworkLines>
      </section>

      {/* Detailed Projects List */}
      <section className="w-full max-w-5xl mx-auto z-10 mt-16">
        {/* Software Projects */}
        {detailedProjects.some(p => p.type === 'software') && (
        <>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-[#2B3674] dark:text-white tracking-tight">
              Software
            </h2>
            <div className="h-px bg-slate-200 dark:bg-slate-700 flex-grow ml-6" />
          </div>

          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {detailedProjects.filter(p => p.type === 'software').map((p) => (
              <div key={p.id} className="break-inside-avoid">
                {renderProjectRow(p, tools)}
              </div>
            ))}
          </div>
        </>
        )}

        {/* Social Projects */}
        {detailedProjects.some(p => p.type !== 'software') && (
        <>
          <div className="flex items-center justify-between mb-8 mt-16">
            <h2 className="text-2xl font-bold text-[#2B3674] dark:text-white tracking-tight">
              Social
            </h2>
            <div className="h-px bg-slate-200 dark:bg-slate-700 flex-grow ml-6" />
          </div>

          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {detailedProjects.filter(p => p.type !== 'software').map((p) => (
              <div key={p.id} className="break-inside-avoid">
                {renderProjectRow(p, tools)}
              </div>
            ))}
          </div>
        </>
        )}
      </section>
    </main>
  );
}
