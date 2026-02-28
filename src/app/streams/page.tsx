import { getDataClient } from '@/lib/client-factory';
import { StreamCard } from '@/components/stream-card';
import React from 'react';

export const metadata = {
    title: 'Streams | Tim Knight',
    description: 'Live coding streams with correlated GitHub commits.',
};

export default async function StreamsPage() {
    const client = getDataClient();
    const streams = await client.getStreams();

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

            {streams.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">No streams yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
                    {streams.map((stream) => (
                        <StreamCard key={stream.id} stream={stream} />
                    ))}
                </div>
            )}
        </main>
    );
}
