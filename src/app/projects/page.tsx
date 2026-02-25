import React from 'react';

export const metadata = {
    title: 'Projects | Tim Knight',
    description: 'A portfolio of software, SaaS, and content projects.',
};

export default function ProjectsPage() {
    return (
        <main className="min-h-[60vh] flex flex-col items-center pt-12 space-y-6">
            <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    All Projects
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 mt-4 max-w-lg">
                    Details and direct links to all active and retired ventures. Coming soon.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                <div className="h-48 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl animate-pulse"></div>
                <div className="h-48 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl animate-pulse"></div>
                <div className="h-48 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl animate-pulse"></div>
                <div className="h-48 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl animate-pulse"></div>
            </div>
        </main>
    );
}
