import { getDataClient } from '@/lib/client-factory';
import { StreamsFilteredList } from '@/components/streams-filtered-list';
import { Project } from '@/lib/data-client';
import React from 'react';

export const metadata = {
    title: 'Streams | Tim Knight',
    description: 'Live coding streams with correlated GitHub commits.',
};

export default async function StreamsPage() {
    const client = getDataClient();
    const [streams, allProjects] = await Promise.all([
        client.getStreams(),
        client.getProjects(),
    ]);

    const projectMap: Record<string, Project> = {};
    for (const p of allProjects) {
        projectMap[p.id] = p;
    }

    return (
        <main className="min-h-[60vh] flex flex-col items-center pt-12 space-y-6">
            <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Streams
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 mt-4 max-w-lg">
                    Live coding sessions with real-time commits.
                </p>
            </div>

            <StreamsFilteredList streams={streams} projectMap={projectMap} />
        </main>
    );
}
