"use client";

import { Menu, X } from 'lucide-react';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    const navItems = [
        { name: 'Projects', path: '/projects' },
        { name: 'Streams', path: '/streams' },
        { name: 'Blog', path: '/blog' }
    ];

    return (
        <header className="sticky top-0 z-50 py-4 border-b border-white/[0.05] backdrop-blur-sm bg-surface/80">
            <div className="flex items-center justify-between">
                {/* Left side: Logo & Desktop Navigation */}
                <div className="flex items-center gap-8">
                    <Link href="/" className="text-xl font-bold tracking-tight text-white hover:text-accent transition-colors flex items-center gap-2">
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
                                        ? 'text-accent bg-accent-bg'
                                        : 'text-slate-500 hover:text-accent'
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
                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2.5 rounded-full bg-white/[0.05] text-slate-400 hover:bg-white/[0.08] transition-all"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle mobile menu"
                    >
                        {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 mt-2 bg-[#0a0a0f]/95 backdrop-blur-md border border-white/[0.05] rounded-xl overflow-hidden py-2 px-3 flex flex-col gap-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.name}
                                href={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 w-full text-center ${isActive
                                    ? 'text-accent bg-accent-bg'
                                    : 'text-slate-500 hover:text-accent'
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
