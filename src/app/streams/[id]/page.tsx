import { getDataClient } from '@/lib/client-factory';
import { YouTubeEmbed } from '@/components/youtube-embed';
import { StreamStats } from '@/components/stream-stats';
import { StreamCommitGroup } from '@/components/stream-commit-group';
import { ProjectTag } from '@/components/project-tag';
import { notFound } from 'next/navigation';
import React from 'react';
import { StreamCommit, Project } from '@/lib/data-client';

interface StreamDetailPageProps {
    params: Promise<{ id: string }>;
}

function groupCommitsByRepo(commits: StreamCommit[]): Record<string, StreamCommit[]> {
    const groups: Record<string, StreamCommit[]> = {};
    for (const commit of commits) {
        if (!groups[commit.repo]) groups[commit.repo] = [];
        groups[commit.repo].push(commit);
    }
    return groups;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

export default async function StreamDetailPage({ params }: StreamDetailPageProps) {
    const { id } = await params;
    const client = getDataClient();
    const [stream, allProjects] = await Promise.all([
        client.getStreamById(id),
        client.getProjects(),
    ]);

    if (!stream) return notFound();

    const projectMap = new Map<string, Project>(allProjects.map(p => [p.id, p]));
    const commitProjectIds = stream.commits.map(c => c.projectId).filter(Boolean);
    const allProjectIds = [...new Set([...stream.projectIds, ...commitProjectIds])];
    const projects = allProjectIds
        .map(pid => projectMap.get(pid))
        .filter((p): p is Project => p !== undefined);

    const commitGroups = groupCommitsByRepo(stream.commits);

    return (
        <main className="min-h-[60vh] py-10 space-y-8 max-w-4xl mx-auto">
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                    {formatDate(stream.actualStartTime)}
                </p>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {stream.name}
                </h1>
                {projects.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {projects.map((project) => (
                            <ProjectTag key={project.id} project={project} />
                        ))}
                    </div>
                )}
            </div>

            <YouTubeEmbed videoId={stream.videoId} title={stream.name} />

            <StreamStats
                viewCount={stream.viewCount}
                likeCount={stream.likeCount}
                commentCount={stream.commentCount}
                duration={stream.duration}
                commitCount={stream.commits.length}
            />

            {Object.keys(commitGroups).length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        Commits During Stream
                    </h2>
                    {Object.entries(commitGroups).map(([repo, commits]) => (
                        <StreamCommitGroup key={repo} repo={repo} commits={commits} />
                    ))}
                </section>
            )}
        </main>
    );
}
