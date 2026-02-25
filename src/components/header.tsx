"use client";

import { useTheme } from 'next-themes';
import { Moon, Sun, Menu, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
    }, []);

    const navItems = [
        { name: 'Dashboard', path: '/' },
        { name: 'Projects', path: '/projects' },
        { name: 'Blog', path: '/blog' }
    ];

    return (
        <header className="py-4 border-b border-slate-200/50 dark:border-slate-800/50 relative z-50">
            <div className="flex items-center justify-between">
                {/* Left side: Logo & Desktop Navigation */}
                <div className="flex items-center gap-8">
                    <Link href="/" className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        Tim Knight
                    </Link>

                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
                            return (
                                <Link
                                    key={item.name}
                                    href={item.path}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${isActive
                                        ? 'text-slate-900 dark:text-white bg-slate-100/50 dark:bg-slate-800/50'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/30'
                                        }`}
                                >
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center justify-end gap-2">
                    <button
                        aria-label="Toggle theme"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
                    >
                        {mounted ? (theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />) : <div className="w-[18px] h-[18px]" />}
                    </button>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2.5 rounded-full bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle mobile menu"
                    >
                        {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0B1437] border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden py-2 px-3 flex flex-col gap-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.name}
                                href={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 w-full text-center ${isActive
                                    ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800/50'
                                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/30'
                                    }`}
                            >
                                {item.name}
                            </Link>
                        )
                    })}
                </div>
            )}
        </header>
    );
}
