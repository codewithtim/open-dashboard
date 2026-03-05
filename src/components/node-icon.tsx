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

export function NodeIcon({ icon, label, color = "text-slate-400", delay = 0, href }: NodeIconProps) {
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
            <div className="absolute inset-0 bg-white/[0.03] rounded-2xl backdrop-blur-md border border-white/[0.05] shadow-lg group-hover:shadow-[0_0_30px_var(--accent-glow)] transition-all duration-300" />
            <div className={`relative z-10 w-8 h-8 flex items-center justify-center ${color}`}>
                {icon}
            </div>
            <span className="mt-2 text-xs font-medium text-slate-500 absolute -bottom-6 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
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
