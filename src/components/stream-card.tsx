import Link from 'next/link';
import { StreamSummary } from '@/lib/data-client';
import { Eye, GitCommitHorizontal } from 'lucide-react';

interface StreamCardProps {
    stream: StreamSummary;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function StreamCard({ stream }: StreamCardProps) {
    return (
        <Link href={`/streams/${stream.id}`}>
            <div className="group bg-white dark:bg-[#111C44] rounded-2xl overflow-hidden shadow-[0_18px_40px_-12px_rgba(112,144,176,0.12)] dark:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_45px_-10px_rgba(112,144,176,0.2)] transition-all duration-300">
                <div className="relative aspect-video bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    {stream.thumbnailUrl ? (
                        <img
                            src={stream.thumbnailUrl}
                            alt={stream.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                            No thumbnail
                        </div>
                    )}
                </div>
                <div className="p-5">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        {formatDate(stream.actualStartTime)}
                    </p>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white line-clamp-2 mb-3">
                        {stream.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
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
