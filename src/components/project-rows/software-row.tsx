import { ProjectDetails } from '@/lib/data-client';
import { FaLaptopCode } from 'react-icons/fa';

export function SoftwareProjectRow({ project }: { project: ProjectDetails }) {
    // Extract specific Software metrics if they exist
    const mrrMetric = project.metrics?.find(m => m.name.toLowerCase().includes('mrr'));
    const usersMetric = project.metrics?.find(m => m.name.toLowerCase().includes('user') || m.name.toLowerCase().includes('active'));

    return (
        <div className="group bg-white dark:bg-[#111C44] rounded-[20px] shadow-[0_18px_40px_-12px_rgba(112,144,176,0.12)] hover:shadow-[0_20px_45px_-10px_rgba(112,144,176,0.2)] dark:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.5)] transition-all duration-300 font-sans p-6 flex flex-col xl:flex-row justify-between xl:items-center gap-6">

            {/* Left: Identity */}
            <div className="flex items-center gap-5 min-w-[250px]">
                <div className="p-3 bg-[#F4F7FE] dark:bg-[#0B1437] rounded-full group-hover:scale-105 transition-transform flex items-center justify-center min-w-12 min-h-12">
                    <FaLaptopCode className="w-5 h-5 text-[#4318FF]" />
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

            {/* Right: Inline Metrics Flex Container */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 xl:justify-end flex-grow">
                {/* Specific Software Stats */}
                {mrrMetric && (
                    <div className="flex flex-col text-left xl:text-right">
                        <span className="text-[#A3AED0] text-xs font-semibold uppercase tracking-wider mb-1">MRR</span>
                        <span className="font-bold text-[#2B3674] dark:text-white text-base">${mrrMetric.value.toLocaleString()}</span>
                    </div>
                )}

                {usersMetric && (
                    <div className="flex flex-col text-left xl:text-right">
                        <span className="text-[#A3AED0] text-xs font-semibold uppercase tracking-wider mb-1">Active Users</span>
                        <span className="font-bold text-[#2B3674] dark:text-white text-base">{usersMetric.value.toLocaleString()}</span>
                    </div>
                )}

                {/* Fallback for other metrics to ensure nothing gets lost */}
                {project.metrics?.filter(m => !m.name.toLowerCase().includes('mrr') && !m.name.toLowerCase().includes('user') && !m.name.toLowerCase().includes('active')).map(m => (
                    <div key={m.name} className="flex flex-col text-left xl:text-right">
                        <span className="text-[#A3AED0] text-xs font-semibold uppercase tracking-wider mb-1">{m.name}</span>
                        <span className="font-bold text-[#2B3674] dark:text-white text-base">{m.value.toLocaleString()}</span>
                    </div>
                ))}

                {/* Standard Financials */}
                <div className="flex flex-col text-left xl:text-right">
                    <span className="text-[#A3AED0] text-xs font-semibold uppercase tracking-wider mb-1">Revenue</span>
                    <span className="font-bold text-[#2B3674] dark:text-white text-base">${project.totalRevenue.toLocaleString()}</span>
                </div>

                <div className="flex flex-col text-left xl:text-right">
                    <span className="text-[#A3AED0] text-xs font-semibold uppercase tracking-wider mb-1">Profit</span>
                    <span className="font-bold text-emerald-500 dark:text-emerald-400 text-base">${project.netProfit.toLocaleString()}</span>
                </div>

                <div className="flex flex-col text-left xl:text-right">
                    <span className="text-[#A3AED0] text-xs font-semibold uppercase tracking-wider mb-1">Total Costs</span>
                    <span className="font-bold text-rose-500 dark:text-rose-400 text-base">${project.totalCosts.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}
