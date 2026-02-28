"use client";

import { AnimatedCounter } from '@/components/animated-counter';
import { Eye, ThumbsUp, MessageCircle, Clock, GitCommitHorizontal } from 'lucide-react';

interface StreamStatsProps {
    viewCount: number;
    likeCount: number;
    commentCount: number;
    duration: string;
    commitCount: number;
}

function formatDuration(iso: string): string {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return iso;
    const hours = match[1] ? `${match[1]}h` : '';
    const minutes = match[2] ? `${match[2]}m` : '';
    const seconds = match[3] ? `${match[3]}s` : '';
    return [hours, minutes, seconds].filter(Boolean).join(' ');
}

export function StreamStats({ viewCount, likeCount, commentCount, duration, commitCount }: StreamStatsProps) {
    const stats = [
        { label: 'Views', value: viewCount, icon: Eye },
        { label: 'Likes', value: likeCount, icon: ThumbsUp },
        { label: 'Comments', value: commentCount, icon: MessageCircle },
        { label: 'Commits', value: commitCount, icon: GitCommitHorizontal },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {stats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-white dark:bg-[#111C44] rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                        <Icon size={14} />
                        <span className="text-xs font-medium">{label}</span>
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">
                        <AnimatedCounter value={value} />
                    </div>
                </div>
            ))}
            <div className="bg-white dark:bg-[#111C44] rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                    <Clock size={14} />
                    <span className="text-xs font-medium">Duration</span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {formatDuration(duration)}
                </div>
            </div>
        </div>
    );
}
