import React from 'react';

interface ProgressBarProps {
    currentValue: number;
    targetValue?: number;
}

export function ProgressBar({ currentValue, targetValue = 1000000 }: ProgressBarProps) {
    const rawPercentage = (currentValue / targetValue) * 100;
    const boundedPercentage = Math.min(Math.max(rawPercentage, 0), 100);

    return (
        <div className="w-full flex flex-col space-y-3">
            <div className="flex justify-between items-end text-sm font-medium px-1">
                <span className="text-white text-2xl font-bold tracking-tight">
                    ${currentValue.toLocaleString()}
                </span>
                <span className="text-slate-500 font-semibold tracking-wide">
                    {rawPercentage.toFixed(1)}% to $1M Goal
                </span>
            </div>

            <div className="h-4 w-full bg-white/[0.05] rounded-full overflow-hidden backdrop-blur-sm border border-white/[0.05] relative">
                {/* Glow effect tracking the bar */}
                <div
                    className="absolute top-0 bottom-0 left-0 bg-accent/20 blur-md transition-all duration-1000"
                    style={{ width: `${boundedPercentage}%` }}
                />

                <div
                    data-testid="progress-filler"
                    className="h-full bg-gradient-to-r from-accent-muted via-accent to-accent-secondary transition-all duration-1000 ease-out rounded-full relative z-10 shadow-[inset_0_1px_rgba(255,255,255,0.2)]"
                    style={{ width: `${boundedPercentage}%` }}
                />
            </div>
        </div>
    );
}
