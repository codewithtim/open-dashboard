import { getDataClient } from '@/lib/client-factory';
import { DashboardCard } from '@/components/dashboard-card';
import React from 'react';
import { renderProjectRow } from '@/components/project-rows';
import { CentralStatsHub } from '@/components/central-stats-hub';
import { NetworkLines } from '@/components/network-lines';
import { NodeIcon } from '@/components/node-icon';
import { FiYoutube, FiTwitter, FiGithub, FiBox } from 'react-icons/fi';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const client = getDataClient();
  const stats = await client.getAggregatedDashboardStats();
  const lightweightProjects = await client.getProjects();
  const activeIds = lightweightProjects.map(p => p.id);
  const detailedProjects = await client.getMultipleProjectDetails(activeIds);
  const softwareProjectsCount = detailedProjects.filter(p => p.type.toLowerCase() === 'software' || p.platform?.toLowerCase() === 'software').length;

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
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-[#2B3674] dark:text-white tracking-tight">
            Active Projects Activity
          </h2>
          <div className="h-px bg-slate-200 dark:bg-slate-700 flex-grow ml-6" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {detailedProjects.map((p) => (
            <React.Fragment key={p.id}>
              {renderProjectRow(p)}
            </React.Fragment>
          ))}
        </div>
      </section>
    </main>
  );
}
