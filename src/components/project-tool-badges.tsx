import Link from 'next/link';
import { Tool } from '@/lib/data-client';
import { getToolIcon } from '@/lib/tool-icons';

export function ProjectToolBadges({ tools }: { tools: Tool[] }) {
    if (tools.length === 0) return null;

    return (
        <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[#A3AED0] text-[10px] font-semibold uppercase tracking-wider">Tools</span>
            <div className="flex items-center gap-2 flex-wrap">
                {tools.map(tool => {
                    const Icon = getToolIcon(tool.iconKey);
                    return (
                        <Link
                            key={tool.id}
                            href={`/tools/${tool.slug}`}
                            title={tool.name}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            {Icon ? (
                                <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            ) : (
                                <span className="text-xs text-slate-500 dark:text-slate-400">{tool.name}</span>
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
