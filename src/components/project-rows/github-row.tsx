import { ProjectDetails, Tool } from '@/lib/data-client';
import { FaGithub } from 'react-icons/fa';
import { AnimatedCounter } from '../animated-counter';
import { ProjectToolBadges } from '../project-tool-badges';
import Image from 'next/image';

export function GithubProjectRow({ project, icon, tools }: { project: ProjectDetails; icon?: React.ReactNode; tools?: Tool[] }) {
    const starMetric = project.metrics?.find(m => m.name.toLowerCase().includes('star'));
    const forkMetric = project.metrics?.find(m => m.name.toLowerCase().includes('fork'));

    return (
        <div className="group bg-white dark:bg-[#111C44] rounded-[20px] shadow-[0_18px_40px_-12px_rgba(112,144,176,0.12)] hover:shadow-[0_20px_45px_-10px_rgba(112,144,176,0.2)] dark:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.5)] transition-all duration-300 font-sans p-6 flex flex-col gap-6">

            {/* Top: Identity */}
            <div className="flex items-center gap-5">
                <div className="p-3 bg-slate-100 dark:bg-[#0B1437] rounded-full group-hover:scale-105 transition-transform flex items-center justify-center min-w-12 min-h-12 border border-slate-200 dark:border-slate-800">
                    {icon || <FaGithub className="w-6 h-6 text-slate-900 dark:text-white" />}
                </div>
                <div>
                    {project.link ? (
                        <a href={project.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            <h3 className="font-bold text-lg text-[#2B3674] dark:text-white mb-0.5">{project.name}</h3>
                        </a>
                    ) : (
                        <h3 className="font-bold text-lg text-[#2B3674] dark:text-white mb-0.5">{project.name}</h3>
                    )}
                    <p className="text-sm font-medium text-[#A3AED0] capitalize">{project.type}</p>
                </div>
            </div>

            {/* Middle: Financials (3 Columns) */}
            <div className={`grid grid-cols-3 gap-4 ${project.metrics?.length ? 'pb-4 border-b border-slate-100 dark:border-slate-800' : ''}`}>
                <div className="flex flex-col text-left">
                    <span className="text-[#A3AED0] text-[10px] font-semibold uppercase tracking-wider mb-1">Revenue</span>
                    <span className="font-bold text-[#2B3674] dark:text-white text-sm">
                        <AnimatedCounter value={project.totalRevenue} prefix="$" />
                    </span>
                </div>
                <div className="flex flex-col text-left">
                    <span className="text-[#A3AED0] text-[10px] font-semibold uppercase tracking-wider mb-1">Profit</span>
                    <span className="font-bold text-emerald-500 dark:text-emerald-400 text-sm">
                        <AnimatedCounter value={project.netProfit} prefix="$" />
                    </span>
                </div>
                <div className="flex flex-col text-left">
                    <span className="text-[#A3AED0] text-[10px] font-semibold uppercase tracking-wider mb-1">Costs</span>
                    <span className="font-bold text-rose-500 dark:text-rose-400 text-sm">
                        <AnimatedCounter value={project.totalCosts} prefix="$" />
                    </span>
                </div>
            </div>

            {/* Bottom: Metrics Grid */}
            {project.metrics && project.metrics.length > 0 && (
            <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                {starMetric && (
                    <div className="flex flex-col text-left">
                        <span className="text-[#A3AED0] text-xs font-semibold uppercase tracking-wider mb-1">Stars</span>
                        <span className="font-bold text-[#2B3674] dark:text-white text-base">
                            <AnimatedCounter value={starMetric.value} />
                        </span>
                    </div>
                )}

                {forkMetric && (
                    <div className="flex flex-col text-left">
                        <span className="text-[#A3AED0] text-xs font-semibold uppercase tracking-wider mb-1">Forks</span>
                        <span className="font-bold text-[#2B3674] dark:text-white text-base">
                            <AnimatedCounter value={forkMetric.value} />
                        </span>
                    </div>
                )}

                {/* Fallbacks */}
                {project.metrics?.filter(m => !m.name.toLowerCase().includes('star') && !m.name.toLowerCase().includes('fork')).map(m => (
                    <div key={m.name} className="flex flex-col text-left">
                        <span className="text-[#A3AED0] text-xs font-semibold uppercase tracking-wider mb-1">{m.name}</span>
                        <span className="font-bold text-[#2B3674] dark:text-white text-base">
                            <AnimatedCounter value={m.value} />
                        </span>
                    </div>
                ))}
            </div>
            )}

            {tools && <ProjectToolBadges tools={tools} />}
        </div>
    );
}
