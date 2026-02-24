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
                "p-6 rounded-[20px] transition-all duration-300 ease-in-out font-sans",
                featured
                    ? "bg-gradient-to-br from-[#4318FF] to-[#868CFF] text-white shadow-[0_18px_40px_-12px_rgba(67,24,255,0.3)]"
                    : "bg-white dark:bg-[#111C44] shadow-[0_18px_40px_-12px_rgba(112,144,176,0.12)] hover:shadow-[0_20px_45px_-10px_rgba(112,144,176,0.2)] dark:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.5)]"
            )}
        >
            <h3 className={clsx(
                "text-sm font-medium mb-1",
                featured ? "text-white/80" : "text-[#A3AED0]"
            )}>
                {title}
            </h3>
            <div className="flex items-baseline gap-3">
                <span className={clsx(
                    "text-3xl font-bold tracking-tight",
                    featured ? "text-white" : "text-[#2B3674] dark:text-white"
                )}>{value}</span>
                {trend && (
                    <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {trend}
                    </span>
                )}
            </div>
        </div>
    );
}
