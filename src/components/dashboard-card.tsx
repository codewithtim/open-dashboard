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
                    ? "bg-neutral-900 border-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:border-neutral-200 shadow-lg"
                    : "bg-white border-neutral-200 text-neutral-900 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-50 shadow-sm hover:shadow-md"
            )}
        >
            <h3 className={clsx(
                "text-sm font-medium mb-2",
                featured ? "text-neutral-400 dark:text-neutral-500" : "text-neutral-500 dark:text-neutral-400"
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
