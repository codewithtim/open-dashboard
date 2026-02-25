import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Share2, Twitter, Linkedin, Github } from 'lucide-react';
import Image from 'next/image';

export const metadata = {
    title: 'Welcome to the Open Dashboard | Blog',
    description: 'A boilerplate for blog posts demonstrating the layout and typography.',
};

export default function BlogPostPage() {
    return (
        <main className="min-h-screen py-10 px-4 flex flex-col items-center bg-slate-50/50 dark:bg-[#0B1437]">
            <article className="w-full max-w-3xl flex flex-col gap-8">

                {/* Back Button */}
                <div className="w-full">
                    <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                        <ArrowLeft size={16} /> Back to Blog
                    </Link>
                </div>

                {/* Header Section */}
                <header className="space-y-6">
                    <div className="flex items-center gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-xs uppercase tracking-wider">
                            Announcement
                        </span>
                        <span className="flex items-center gap-1.5"><Calendar size={15} /> Feb 25, 2026</span>
                        <span className="flex items-center gap-1.5"><Clock size={15} /> 5 min read</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                        Welcome to the Open Dashboard Boilerplate
                    </h1>

                    <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-light">
                        A beautiful, typography-focused boilerplate to demonstrate how long-form content will look on the Open Dashboard. Let's explore the styling.
                    </p>

                    {/* Author Row */}
                    <div className="flex justify-between items-center py-6 border-y border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                                {/* Placeholder for avatar */}
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#4318FF] to-[#868CFF] text-white font-bold text-lg">
                                    TK
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-900 dark:text-white">Tim Knight</span>
                                <span className="text-sm text-slate-500 dark:text-slate-400">Builder & Creator</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors">
                                <Twitter size={18} />
                            </button>
                            <button className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors">
                                <Linkedin size={18} />
                            </button>
                            <button className="hidden md:flex p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors">
                                <Share2 size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Hero Image Placeholder */}
                <div className="w-full aspect-video rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden relative group">
                    <span className="text-slate-400 dark:text-slate-600 font-medium">Hero Image (16:9)</span>
                </div>

                {/* Content Section (Prose) */}
                <div className="prose prose-lg dark:prose-invert prose-indigo prose-headings:font-bold prose-headings:tracking-tight prose-a:text-[#4318FF] dark:prose-a:text-[#868CFF] hover:prose-a:text-indigo-500 max-w-none w-full">

                    <h2>Building in Public</h2>
                    <p>
                        This is a demonstration of the body copy. The text is designed to be highly readable with generous line height and optimal line lengths. Building in public is not just about sharing the wins; it's about documenting the entire journey.
                    </p>

                    <p>
                        When creating this dashboard, I wanted to ensure that long-form writing felt native to the rest of the application. That means matching the sleek, dark-mode compatible design system while prioritizing typographic hierarchy.
                    </p>

                    <blockquote>
                        "The best time to plant a tree was 20 years ago. The second best time is now. This blockquote styling adds a nice visual break to the text flow."
                    </blockquote>

                    <h3>Typography Hierarchy</h3>
                    <p>
                        Here's an example of an unordered list detailing the tech stack:
                    </p>
                    <ul>
                        <li><strong>Next.js 15:</strong> The React framework for production.</li>
                        <li><strong>Tailwind CSS:</strong> For rapid utility-first styling.</li>
                        <li><strong>Framer Motion:</strong> For orchestrating those buttery smooth layout animations.</li>
                        <li><strong>Lucide Icons:</strong> Consistent, beautiful iconography.</li>
                    </ul>

                    <h3>Code Snippet Example</h3>
                    <p>
                        Technical blogs often need code snippets. Here's a quick look at how inline <code>code elements</code> and block snippets will look:
                    </p>

                    <pre><code>{`export function ExampleComponent() {
    return (
        <div className="demo-block">
            <p>Hello World</p>
        </div>
    );
}`}</code></pre>

                    <h2>The Journey Ahead</h2>
                    <p>
                        As we progress towards the $1M ARR goal, this section will host detailed monthly reports, technical deep-dives into scaling systems, and lessons learned from marketing experiments.
                    </p>

                    <hr className="my-10" />

                    <p className="text-sm font-medium text-slate-500">
                        Thanks for reading. If you enjoyed this post, consider following the journey on <a href="#">Twitter</a> or checking out the <a href="/">Dashboard</a>.
                    </p>
                </div>
            </article>
        </main>
    );
}
