import { getDataClient } from '@/lib/client-factory';
import { ToolIcon } from '@/components/tool-icon';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function ToolDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const client = getDataClient();
    const tool = await client.getToolBySlug(slug);

    if (!tool) {
        notFound();
    }

    const relatedProjects = tool.projectIds.length > 0
        ? await client.getMultipleProjectDetails(tool.projectIds)
        : [];

    return (
        <main className="min-h-screen py-10 px-4 flex flex-col items-center">
            <section className="w-full max-w-3xl mx-auto">
                <Link
                    href="/tools"
                    className="text-sm text-[#A3AED0] hover:text-slate-900 dark:hover:text-white transition-colors mb-8 inline-block"
                >
                    &larr; Back to Tools
                </Link>

                <div className="bg-white dark:bg-[#111C44] rounded-[20px] shadow-[0_18px_40px_-12px_rgba(112,144,176,0.12)] dark:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.5)] p-8">
                    {/* Header */}
                    <div className="flex items-center gap-5 mb-6">
                        <div className="p-4 bg-[#F4F7FE] dark:bg-[#0B1437] rounded-full flex items-center justify-center min-w-16 min-h-16">
                            <ToolIcon iconKey={tool.iconKey} className="w-8 h-8 text-[#4318FF]" fallback={tool.name[0]} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-extrabold text-[#2B3674] dark:text-white">{tool.name}</h1>
                                {tool.recommended && (
                                    <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                                        Recommended
                                    </span>
                                )}
                            </div>
                            <p className="text-sm font-medium text-[#A3AED0] capitalize">{tool.category}</p>
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-8">
                        {tool.description}
                    </p>

                    {/* CTA */}
                    {tool.referralUrl && (
                        <a
                            href={tool.referralUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-[#4318FF] hover:bg-[#3311CC] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                        >
                            Try {tool.name}
                            <span aria-hidden="true">&rarr;</span>
                        </a>
                    )}
                </div>

                {/* Related Projects */}
                {relatedProjects.length > 0 && (
                    <div className="mt-12">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-[#2B3674] dark:text-white tracking-tight">
                                Projects using {tool.name}
                            </h2>
                            <div className="h-px bg-slate-200 dark:bg-slate-700 flex-grow ml-6" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {relatedProjects.map((project) => (
                                <div
                                    key={project.id}
                                    className="bg-white dark:bg-[#111C44] rounded-[16px] shadow-[0_18px_40px_-12px_rgba(112,144,176,0.12)] dark:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.5)] p-5 flex items-center gap-4"
                                >
                                    <div>
                                        <h3 className="font-bold text-[#2B3674] dark:text-white">{project.name}</h3>
                                        <p className="text-sm text-[#A3AED0] capitalize">{project.type}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}
