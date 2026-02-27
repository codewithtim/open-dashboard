import { ProjectDetails } from '@/lib/data-client';
import { FaTwitch } from 'react-icons/fa6';
import { AnimatedCounter } from '../animated-counter';

export function TwitchProjectRow({ project }: { project: ProjectDetails }) {
    const followerMetric = project.metrics?.find(m => m.name.toLowerCase().includes('follower'));
    const subMetric = project.metrics?.find(m => m.name.toLowerCase().includes('subscriber') || m.name.toLowerCase().includes('sub'));
    const viewMetric = project.metrics?.find(m => m.name.toLowerCase().includes('view'));

    return (
        <div className="group bg-white dark:bg-[#111C44] rounded-[20px] shadow-[0_18px_40px_-12px_rgba(112,144,176,0.12)] hover:shadow-[0_20px_45px_-10px_rgba(112,144,176,0.2)] dark:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.5)] transition-all duration-300 font-sans p-6 flex flex-col gap-6 h-full">

            {/* Top: Identity */}
            <div className="flex items-center gap-5">
                <div className="p-3 bg-[#9146FF]/10 dark:bg-[#0B1437] rounded-full group-hover:scale-105 transition-transform flex items-center justify-center min-w-12 min-h-12 border border-[#9146FF]/30">
                    <FaTwitch className="w-6 h-6 text-[#9146FF]" />
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
            {(followerMetric || subMetric || viewMetric) && (
            <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                {followerMetric && (
                    <div className="flex flex-col text-left">
                        <span className="text-[#A3AED0] text-xs font-semibold uppercase tracking-wider mb-1">Followers</span>
                        <span className="font-bold text-[#2B3674] dark:text-white text-base">
                            <AnimatedCounter value={followerMetric.value} />
                        </span>
                    </div>
                )}

                {subMetric && (
                    <div className="flex flex-col text-left">
                        <span className="text-[#A3AED0] text-xs font-semibold uppercase tracking-wider mb-1">Subscribers</span>
                        <span className="font-bold text-[#2B3674] dark:text-white text-base">
                            <AnimatedCounter value={subMetric.value} />
                        </span>
                    </div>
                )}

                {viewMetric && (
                    <div className="flex flex-col text-left">
                        <span className="text-[#A3AED0] text-xs font-semibold uppercase tracking-wider mb-1">Views</span>
                        <span className="font-bold text-[#2B3674] dark:text-white text-base">
                            <AnimatedCounter value={viewMetric.value} />
                        </span>
                    </div>
                )}
            </div>
            )}
        </div>
    );
}
