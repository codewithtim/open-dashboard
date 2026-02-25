"use client";

import React from 'react';
import { DashboardStats } from '@/lib/data-client';
import { motion } from 'framer-motion';
import { AnimatedCounter } from './animated-counter';

interface CentralStatsHubProps {
    stats: DashboardStats;
    softwareProjectsCount?: number;
}

export function CentralStatsHub({ stats, softwareProjectsCount = 0 }: CentralStatsHubProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center justify-center p-8 rounded-3xl bg-white/70 dark:bg-[#111C44]/70 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] max-w-sm mx-auto min-w-[280px]"
        >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/40 to-white/0 dark:from-white/5 dark:to-transparent pointer-events-none" />

            <div className="text-center mb-6 z-10">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    Total Revenue
                </h2>
                <div className="text-5xl font-extrabold tracking-tighter text-slate-900 dark:text-white">
                    <AnimatedCounter value={stats.totalRevenue} prefix="$" />
                </div>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent my-4 z-10" />

            <div className="flex flex-col w-full z-10 gap-4 mt-2">
                <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Subscribers</span>
                    <span className="text-xl font-bold text-slate-800 dark:text-white">
                        <AnimatedCounter value={stats.totalSubscribers} />
                    </span>
                </div>

                <div className="w-full h-px bg-slate-200 dark:bg-slate-700 shrink-0" />

                <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Views</span>
                    <span className="text-xl font-bold text-slate-800 dark:text-white">
                        <AnimatedCounter value={stats.totalViews} />
                    </span>
                </div>

                {softwareProjectsCount > 0 && (
                    <>
                        <div className="w-full h-px bg-slate-200 dark:bg-slate-700 shrink-0" />

                        <div className="flex justify-between items-center w-full">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Products</span>
                            <span className="text-xl font-bold text-slate-800 dark:text-white">
                                <AnimatedCounter value={softwareProjectsCount} />
                            </span>
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
}
