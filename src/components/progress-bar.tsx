import React from 'react';

interface ProgressBarProps {
    currentValue: number;
    targetValue?: number;
}

export function ProgressBar({ currentValue, targetValue = 1000000 }: ProgressBarProps) {
    const rawPercentage = (currentValue / targetValue) * 100;
    const boundedPercentage = Math.min(Math.max(rawPercentage, 0), 100);

    return (
        <div className="w-full flex flex-col space-y-2">
            <div className="flex justify-between items-end text-sm font-medium">
                <span className="text-neutral-900 dark:text-neutral-100 text-2xl font-semibold tracking-tight">
                    ${currentValue.toLocaleString()}
                </span>
                <span className="text-neutral-500 dark:text-neutral-400">
                    Goal: ${targetValue.toLocaleString()}
                </span>
            </div>

            <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                    data-testid="progress-filler"
                    className="h-full bg-neutral-900 dark:bg-neutral-100 transition-all duration-1000 ease-out rounded-full"
                    style={{ width: `${boundedPercentage}%` }}
                />
            </div>

            <div className="text-right text-xs text-neutral-400">
                {rawPercentage.toFixed(1)}% Completed
            </div>
        </div>
    );
}
