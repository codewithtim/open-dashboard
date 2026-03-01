'use client';

import { useState } from 'react';
import { StreamSummary, Project } from '@/lib/data-client';
import { StreamCard } from './stream-card';
import { ProjectTag } from './project-tag';

interface StreamsFilteredListProps {
    streams: StreamSummary[];
    projectMap: Record<string, Project>;
}

export function StreamsFilteredList({ streams, projectMap }: StreamsFilteredListProps) {
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

    // Derive unique projects that actually appear across streams
    const uniqueProjectIds = [...new Set(streams.flatMap(s => s.projectIds))];
    const availableProjects = uniqueProjectIds
        .map(id => projectMap[id])
        .filter((p): p is Project => p !== undefined);

    const filteredStreams = activeProjectId
        ? streams.filter(s => s.projectIds.includes(activeProjectId))
        : streams;

    return (
        <>
            {availableProjects.length > 0 && (
                <div className="flex flex-wrap gap-2 w-full max-w-5xl justify-center" role="group" aria-label="Filter by project">
                    <button
                        onClick={() => setActiveProjectId(null)}
                        className={`cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                            activeProjectId === null
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md scale-105'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 opacity-60 hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        All
                    </button>
                    {availableProjects.map(project => (
                        <button
                            key={project.id}
                            onClick={() => setActiveProjectId(project.id)}
                            className={`cursor-pointer transition-all rounded-full ${
                                activeProjectId === project.id
                                    ? 'shadow-md scale-105'
                                    : activeProjectId === null
                                        ? 'hover:opacity-80 hover:scale-105'
                                        : 'opacity-60 hover:opacity-100 hover:scale-105'
                            }`}
                        >
                            <ProjectTag project={project} active={activeProjectId === project.id} />
                        </button>
                    ))}
                </div>
            )}

            {filteredStreams.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">No streams yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
                    {filteredStreams.map((stream) => {
                        const projects = stream.projectIds
                            .map(id => projectMap[id])
                            .filter((p): p is Project => p !== undefined);
                        return (
                            <StreamCard key={stream.id} stream={stream} projects={projects} />
                        );
                    })}
                </div>
            )}
        </>
    );
}
