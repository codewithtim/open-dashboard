"use client";

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export function Header() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <header className="flex items-center justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800">
            <div>
                <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                    0 to $1M Challenge
                </h1>
                <p className="text-sm text-neutral-500 mt-1 dark:text-neutral-400">
                    A transparent, open dashboard tracking my progress.
                </p>
            </div>
            <button
                aria-label="Toggle theme"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition"
            >
                {mounted && theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
        </header>
    );
}
