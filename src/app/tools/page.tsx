import { getDataClient } from '@/lib/client-factory';
import { Tool } from '@/lib/data-client';
import { ToolIcon } from '@/components/tool-icon';
import Link from 'next/link';

export default async function ToolsPage() {
    const client = getDataClient();
    const tools = await client.getTools();

    const grouped = tools.reduce<Record<string, Tool[]>>((acc, tool) => {
        const cat = tool.category || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(tool);
        return acc;
    }, {});

    const categories = Object.keys(grouped).sort();

    return (
        <main className="min-h-screen py-10 px-4 flex flex-col items-center">
            <section className="w-full max-w-5xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight text-center">
                    Tools
                </h1>
                <p className="text-center text-[#A3AED0] mb-12">
                    The tools and services used to build and run my projects.
                </p>

                {categories.map((category) => (
                    <div key={category}>
                        <div className="flex items-center justify-between mb-8 mt-12">
                            <h2 className="text-2xl font-bold text-[#2B3674] dark:text-white tracking-tight capitalize">
                                {category}
                            </h2>
                            <div className="h-px bg-slate-200 dark:bg-slate-700 flex-grow ml-6" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {grouped[category].map((tool) => (
                                    <Link
                                        key={tool.id}
                                        href={`/tools/${tool.slug}`}
                                        className="group bg-white dark:bg-[#111C44] rounded-[20px] shadow-[0_18px_40px_-12px_rgba(112,144,176,0.12)] hover:shadow-[0_20px_45px_-10px_rgba(112,144,176,0.2)] dark:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.5)] transition-all duration-300 p-6 flex items-start gap-4"
                                    >
                                        <div className="p-3 bg-[#F4F7FE] dark:bg-[#0B1437] rounded-full group-hover:scale-105 transition-transform flex items-center justify-center min-w-12 min-h-12">
                                            <ToolIcon iconKey={tool.iconKey} className="w-5 h-5 text-[#4318FF]" fallback={tool.name[0]} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-lg text-[#2B3674] dark:text-white">{tool.name}</h3>
                                                {tool.recommended && (
                                                    <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                                                        Recommended
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-[#A3AED0] line-clamp-2">{tool.description}</p>
                                        </div>
                                    </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </section>
        </main>
    );
}
