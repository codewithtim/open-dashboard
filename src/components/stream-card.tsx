import Link from 'next/link';
import { StreamSummary, Project } from '@/lib/data-client';
import { Eye, GitCommitHorizontal } from 'lucide-react';
import { ProjectTag } from './project-tag';

interface StreamCardProps {
    stream: StreamSummary;
    projects?: Project[];
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function StreamCard({ stream, projects = [] }: StreamCardProps) {
    return (
        <Link href={`/streams/${stream.id}`}>
            <div className="group bg-surface-raised border border-surface-border rounded-2xl overflow-hidden hover:border-accent/20 transition-all duration-300">
                <div className="relative aspect-video bg-white/[0.03] overflow-hidden">
                    {stream.thumbnailUrl ? (
                        <img
                            src={stream.thumbnailUrl}
                            alt={stream.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                            No thumbnail
                        </div>
                    )}
                </div>
                <div className="p-5">
                    <p className="text-xs text-slate-500 mb-1">
                        {formatDate(stream.actualStartTime)}
                    </p>
                    <h3 className="text-base font-semibold text-white line-clamp-2 mb-3">
                        {stream.name}
                    </h3>
                    {projects.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {projects.map((project) => (
                                <ProjectTag key={project.id} project={project} />
                            ))}
                        </div>
                    )}
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5">
                            <Eye size={14} />
                            {stream.viewCount.toLocaleString()}
                        </span>
                        {stream.commitCount > 0 && (
                            <span className="flex items-center gap-1.5">
                                <GitCommitHorizontal size={14} />
                                {stream.commitCount}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
