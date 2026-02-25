import React from 'react';

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

            <div className="animate-pulse w-full max-w-2xl mt-12 space-y-4">
                <div className="h-32 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl w-full"></div>
                <div className="h-32 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl w-full"></div>
                <div className="h-32 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl w-full"></div>
            </div>
        </main>
    );
}
