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
                "p-6 rounded-2xl border transition-all duration-200 ease-in-out",
                featured
                    ? "bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-transparent shadow-lg shadow-indigo-500/20"
                    : "bg-white border-neutral-200 hover:border-indigo-500/30 text-neutral-900 dark:bg-neutral-900 dark:border-neutral-800 dark:hover:border-indigo-400/30 dark:text-neutral-50 shadow-sm hover:shadow-md"
            )}
        >
            <h3 className={clsx(
                "text-sm font-medium mb-2",
                featured ? "text-indigo-100" : "text-neutral-500 dark:text-neutral-400"
            )}>
                {title}
            </h3>
            <div className="flex items-baseline gap-3">
                <span className="text-3xl font-semibold tracking-tight">{value}</span>
                {trend && (
                    <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {trend}
                    </span>
                )}
            </div>
        </div>
    );
}
