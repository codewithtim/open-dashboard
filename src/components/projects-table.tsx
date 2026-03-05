import { ProjectDetails } from '@/lib/data-client';
import { FaYoutube, FaNpm, FaTiktok, FaTwitch } from 'react-icons/fa6';
import { FaGithub, FaLaptopCode } from 'react-icons/fa';
import { FaXTwitter, FaInstagram } from 'react-icons/fa6';

function getPlatformIcon(platform?: string) {
    switch (platform) {
        case 'youtube':
            return <FaYoutube className="w-4 h-4 text-[#FF0000]" />;
        case 'github':
            return <FaGithub className="w-4 h-4 text-white" />;
        case 'npm':
            return <FaNpm className="w-4 h-4 text-[#CB3837]" />;
        case 'twitter':
        case 'x':
            return <FaXTwitter className="w-4 h-4 text-white" />;
        case 'instagram':
        case 'ig':
            return <FaInstagram className="w-4 h-4 text-[#E4405F]" />;
        case 'tiktok':
            return <FaTiktok className="w-4 h-4 text-white" />;
        case 'twitch':
            return <FaTwitch className="w-4 h-4 text-[#9146FF]" />;
        default:
            return <FaLaptopCode className="w-4 h-4 text-slate-400" />;
    }
}

interface ProjectsTableProps {
    projects: ProjectDetails[];
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
    return (
        <div className="bg-surface-raised border border-surface-border rounded-2xl overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-white/[0.05]">
                        <th className="text-left text-slate-500 text-xs uppercase tracking-wider font-medium px-5 py-3">Project</th>
                        <th className="text-left text-slate-500 text-xs uppercase tracking-wider font-medium px-5 py-3">Type</th>
                        <th className="text-right text-slate-500 text-xs uppercase tracking-wider font-medium px-5 py-3">Revenue</th>
                        <th className="text-right text-slate-500 text-xs uppercase tracking-wider font-medium px-5 py-3">Profit</th>
                        <th className="text-right text-slate-500 text-xs uppercase tracking-wider font-medium px-5 py-3">Costs</th>
                        <th className="text-right text-slate-500 text-xs uppercase tracking-wider font-medium px-5 py-3 hidden sm:table-cell">Key Metric</th>
                    </tr>
                </thead>
                <tbody>
                    {projects.map((project) => {
                        const keyMetric = project.metrics[0];
                        return (
                            <tr key={project.id} className="border-b border-white/[0.05] hover:bg-surface-hover transition-colors">
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-2.5">
                                        {getPlatformIcon(project.platform)}
                                        {project.link ? (
                                            <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-white font-medium hover:text-accent transition-colors">
                                                {project.name}
                                            </a>
                                        ) : (
                                            <span className="text-white font-medium">{project.name}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-5 py-4 text-slate-400 text-sm capitalize">{project.type}</td>
                                <td className="px-5 py-4 text-right text-white text-sm">${project.totalRevenue.toLocaleString()}</td>
                                <td className={`px-5 py-4 text-right text-sm ${project.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    ${project.netProfit.toLocaleString()}
                                </td>
                                <td className="px-5 py-4 text-right text-rose-400 text-sm">${project.totalCosts.toLocaleString()}</td>
                                <td className="px-5 py-4 text-right text-slate-300 text-sm hidden sm:table-cell">
                                    {keyMetric ? `${keyMetric.value.toLocaleString()} ${keyMetric.name}` : '—'}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
