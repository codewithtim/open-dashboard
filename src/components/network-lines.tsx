"use client";

import React, { useEffect, useState } from 'react';
import { ProjectDetails } from '@/lib/data-client';
import { NodeIcon } from './node-icon';
import { FiYoutube, FiTwitter, FiBox, FiVideo, FiCamera, FiMonitor, FiActivity } from 'react-icons/fi';
import { FaTiktok, FaTwitch, FaGithub } from 'react-icons/fa6';

import { useWindowSize } from 'react-use';

interface NetworkLinesProps {
    projects: ProjectDetails[];
    children?: React.ReactNode;
}

const getPlatformConfig = (project: ProjectDetails) => {
    const platform = project.platform?.toLowerCase() || project.type?.toLowerCase();
    switch (platform) {
        case 'youtube':
            return { icon: <FiYoutube className="w-full h-full" />, color: "text-red-500" };
        case 'twitter':
        case 'x':
            return { icon: <FiTwitter className="w-full h-full" />, color: "text-blue-400" };
        case 'tiktok':
            return { icon: <FaTiktok className="w-full h-full p-[2px]" />, color: "text-slate-800 dark:text-white" };
        case 'twitch':
            return { icon: <FaTwitch className="w-full h-full p-[2px]" />, color: "text-purple-500" };
        case 'instagram':
        case 'ig':
            return { icon: <FiCamera className="w-full h-full" />, color: "text-pink-500" };
        case 'github':
            return { icon: <FaGithub className="w-full h-full p-[2px]" />, color: "text-slate-800 dark:text-white" };
        case 'software':
        case 'saas':
            return { icon: <FiBox className="w-full h-full" />, color: "text-indigo-500" };
        default:
            return { icon: <FiActivity className="w-full h-full" />, color: "text-slate-500" };
    }
};

export function NetworkLines({ projects = [], children }: NetworkLinesProps) {
    const [mounted, setMounted] = useState(false);
    const { width } = useWindowSize();
    const isMobile = mounted ? width < 768 : false;

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // Distribute projects into two groups (Desktop: Left/Right, Mobile: Top/Bottom)
    const firstGroup: ProjectDetails[] = [];
    const secondGroup: ProjectDetails[] = [];

    projects.forEach((p, index) => {
        if (index % 2 === 0) firstGroup.push(p);
        else secondGroup.push(p);
    });

    const calculatePositions = (count: number) => {
        if (count === 0) return [];
        if (count === 1) return [50];

        // Distribute evenly between 20% and 80%
        const start = 20;
        const end = 80;
        const step = (end - start) / (count - 1);
        return Array.from({ length: count }, (_, i) => start + (i * step));
    };

    const firstPositions = calculatePositions(firstGroup.length);
    const secondPositions = calculatePositions(secondGroup.length);

    const nodes = isMobile
        ? [
            ...firstGroup.map((p, i) => ({ project: p, x: firstPositions[i], y: 8, isTop: true })),
            ...secondGroup.map((p, i) => ({ project: p, x: secondPositions[i], y: 92, isTop: false }))
        ]
        : [
            ...firstGroup.map((p, i) => ({ project: p, x: 15, y: firstPositions[i], isTop: false })),
            ...secondGroup.map((p, i) => ({ project: p, x: 85, y: secondPositions[i], isTop: false }))
        ];

    const center = { x: 50, y: 50 };

    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* SVG Background Lines */}
            <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
            >
                <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="1" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <linearGradient id="gradient-line" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="100">
                        <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.1" />
                        <stop offset="50%" stopColor="#cbd5e1" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.1" />
                    </linearGradient>
                </defs>

                {nodes.map((node, i) => (
                    <g key={`path-${node.project.id}`}>
                        <path
                            d={`M ${center.x} ${center.y} C ${center.x} ${node.y}, ${node.x} ${center.y}, ${node.x} ${node.y}`}
                            fill="none"
                            stroke="url(#gradient-line)"
                            strokeWidth="2"
                            vectorEffect="non-scaling-stroke"
                            strokeDasharray="4 4"
                            className="opacity-60"
                        />
                        <circle r="0.6" fill="#94a3b8" filter="url(#glow)">
                            <animateMotion
                                dur={`${3 + (i % 3) * 0.5}s`}
                                repeatCount="indefinite"
                                path={`M ${node.x} ${node.y} C ${node.x} ${center.y}, ${center.x} ${node.y}, ${center.x} ${center.y}`}
                            />
                        </circle>
                    </g>
                ))}
            </svg>

            {/* Absolute Positioned HTML Nodes */}
            {nodes.map((node, i) => {
                const config = getPlatformConfig(node.project);
                return (
                    <div
                        key={`node-${node.project.id}`}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                        style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    >
                        <NodeIcon
                            icon={config.icon}
                            label={node.project.name}
                            color={config.color}
                            delay={0.2 + (i * 0.1)}
                            href={node.project.link}
                        />
                    </div>
                );
            })}

            {/* Central Children (Stats Hub) */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto w-full px-4 md:w-auto">
                {children}
            </div>
        </div>
    );
}
