'use client';

import { getToolIcon } from '@/lib/tool-icons';

export function ToolIcon({ iconKey, className, fallback }: { iconKey: string; className?: string; fallback: string }) {
    const Icon = getToolIcon(iconKey);
    if (Icon) {
        return <Icon className={className} />;
    }
    return <span className={className}>{fallback}</span>;
}
