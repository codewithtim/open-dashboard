import { ProjectDetails } from '@/lib/data-client';
import { FaNpm } from 'react-icons/fa6';
import { AnimatedCounter } from '../animated-counter';

export function NpmProjectRow({ project, icon }: { project: ProjectDetails; icon?: React.ReactNode }) {
    const downloadMetric = project.metrics?.find(m => m.name.toLowerCase().includes('download') && !m.name.toLowerCase().includes('weekly'));
    const weeklyDownloadMetric = project.metrics?.find(m => m.name.toLowerCase().includes('weekly'));

    return (
        <div className="group bg-surface-raised border border-surface-border rounded-[20px] hover:border-accent/20 transition-all duration-300 font-mono p-6 flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />

            {/* Top: Identity */}
            <div className="flex items-center gap-5">
                <div className="p-3 bg-white/[0.05] rounded-full group-hover:scale-105 transition-transform flex items-center justify-center min-w-12 min-h-12 border border-white/[0.08]">
                    {icon || <FaNpm className="w-6 h-6 text-red-600" />}
                </div>
                <div>
                    {project.link ? (
                        <a href={project.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            <h3 className="font-bold text-lg text-white mb-0.5">{project.name}</h3>
                        </a>
                    ) : (
                        <h3 className="font-bold text-lg text-white mb-0.5">{project.name}</h3>
                    )}
                    <p className="text-sm font-medium text-slate-500 capitalize">{project.type}</p>
                </div>
            </div>

            {/* Middle: Financials (3 Columns) */}
            <div className={`grid grid-cols-3 gap-4 ${project.metrics?.length ? 'pb-4 border-b border-white/[0.08]' : ''}`}>
                <div className="flex flex-col text-left">
                    <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-1">Revenue</span>
                    <span className="font-bold text-white text-sm">
                        <AnimatedCounter value={project.totalRevenue} prefix="$" />
                    </span>
                </div>
                <div className="flex flex-col text-left">
                    <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-1">Profit</span>
                    <span className="font-bold text-emerald-400 text-sm">
                        <AnimatedCounter value={project.netProfit} prefix="$" />
                    </span>
                </div>
                <div className="flex flex-col text-left">
                    <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-1">Costs</span>
                    <span className="font-bold text-rose-400 text-sm">
                        <AnimatedCounter value={project.totalCosts} prefix="$" />
                    </span>
                </div>
            </div>

            {/* Bottom: Metrics Grid */}
            {project.metrics && project.metrics.length > 0 && (
            <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                {downloadMetric && (
                    <div className="flex flex-col text-left">
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Downloads</span>
                        <span className="font-bold text-white text-base">
                            <AnimatedCounter value={downloadMetric.value} />
                        </span>
                    </div>
                )}

                {weeklyDownloadMetric && (
                    <div className="flex flex-col text-left">
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Weekly Downloads</span>
                        <span className="font-bold text-white text-base">
                            <AnimatedCounter value={weeklyDownloadMetric.value} />
                        </span>
                    </div>
                )}

                {/* Fallbacks */}
                {project.metrics?.filter(m =>
                    !(m.name.toLowerCase().includes('download') && !m.name.toLowerCase().includes('weekly')) &&
                    !m.name.toLowerCase().includes('weekly')
                ).map(m => (
                    <div key={m.name} className="flex flex-col text-left">
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{m.name}</span>
                        <span className="font-bold text-white text-base">
                            <AnimatedCounter value={m.value} />
                        </span>
                    </div>
                ))}
            </div>
            )}
        </div>
    );
}
