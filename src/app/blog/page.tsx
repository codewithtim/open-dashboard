import React from 'react';
import Link from 'next/link';
import { Calendar, Clock, ChevronRight } from 'lucide-react';

export const metadata = {
    title: 'Blog | Tim Knight',
    description: 'Writing about building in public, SaaS, and the $1M challenge.',
};

export default function BlogPage() {
    return (
        <main className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Blog
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg">
                Essays, updates, and deep dives on building in public. Coming soon.
            </p>
            {/* Boilerplate Post Link */}
            <div className="w-full max-w-2xl mt-12 text-left">
                <Link href="/blog/welcome-to-the-dashboard" className="group block bg-white dark:bg-[#111C44] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex justify-between items-start gap-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1.5"><Calendar size={14} /> Feb 25, 2026</span>
                                <span className="flex items-center gap-1.5"><Clock size={14} /> 5 min read</span>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-[#4318FF] transition-colors">
                                Welcome to the Open Dashboard
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                A brief introduction to why I'm building this dashboard in public, the tech stack behind it, and what you can expect from my $1M ARR challenge updates...
                            </p>
                        </div>
                        <div className="mt-2 text-slate-400 group-hover:text-[#4318FF] group-hover:translate-x-1 transition-all">
                            <ChevronRight />
                        </div>
                    </div>
                </Link>
            </div>
        </main>
    );
}
