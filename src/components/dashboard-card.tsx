import clsx from 'clsx';
import React from 'react';

interface DashboardCardProps {
    title: string;
    value: string;
    trend?: string;
    featured?: boolean;
}

export function DashboardCard({ title, value, trend, featured }: DashboardCardProps) {
    return (
        <div
            className={clsx(
                "p-6 rounded-[20px] transition-all duration-300 ease-in-out font-mono relative overflow-hidden",
                featured
                    ? "bg-gradient-to-br from-accent-muted to-accent-secondary text-white shadow-[0_18px_40px_-12px_var(--accent-glow)]"
                    : "bg-surface-raised border border-surface-border"
            )}
        >
            {/* Accent strip */}
            {!featured && (
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
            )}
            <h3 className={clsx(
                "text-sm font-medium mb-1",
                featured ? "text-white/80" : "text-slate-500"
            )}>
                {title}
            </h3>
            <div className="flex items-baseline gap-3">
                <span className={clsx(
                    "text-3xl font-bold tracking-tight",
                    featured ? "text-white" : "text-white"
                )}>{value}</span>
                {trend && (
                    <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                        {trend}
                    </span>
                )}
            </div>
        </div>
    );
}
