"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface NodeIconProps {
    icon: React.ReactNode;
    label: string;
    color?: string;
    delay?: number;
    href?: string;
}

export function NodeIcon({ icon, label, color = "text-slate-600 dark:text-slate-300", delay = 0, href }: NodeIconProps) {
    const Component = (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: delay
            }}
            whileHover={{ scale: 1.1, y: -5 }}
            className={`relative group flex flex-col items-center justify-center p-4 ${href ? 'cursor-pointer' : ''}`}
        >
            <div className="absolute inset-0 bg-white/40 dark:bg-white/5 rounded-2xl backdrop-blur-md border border-white/20 dark:border-white/10 shadow-lg group-hover:shadow-xl transition-all duration-300" />
            <div className={`relative z-10 w-8 h-8 flex items-center justify-center ${color}`}>
                {icon}
            </div>
            <span className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400 absolute -bottom-6 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {label}
            </span>
        </motion.div>
    );

    if (href) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="block outline-none">
                {Component}
            </a>
        );
    }

    return Component;
}
