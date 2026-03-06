"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['infrastructure', 'tooling', 'services', 'marketing', 'legal', 'other'] as const;

export function AddExpenseForm() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSubmitting(true);

        const form = new FormData(e.currentTarget);
        const body = {
            amount: parseFloat(form.get('amount') as string),
            vendor: form.get('vendor') as string,
            category: form.get('category') as string,
            date: form.get('date') as string,
            note: form.get('note') as string || undefined,
            recurring: form.get('recurring') === 'on',
        };

        const res = await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        setSubmitting(false);
        if (res.ok) {
            router.refresh();
            router.push('/expenses');
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-slate-400 mb-1">Amount</label>
                    <input
                        type="number"
                        id="amount"
                        name="amount"
                        step="0.01"
                        required
                        className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-surface-border text-white placeholder-slate-600 focus:outline-none focus:border-accent"
                        placeholder="0.00"
                    />
                </div>
                <div>
                    <label htmlFor="vendor" className="block text-sm font-medium text-slate-400 mb-1">Vendor</label>
                    <input
                        type="text"
                        id="vendor"
                        name="vendor"
                        required
                        className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-surface-border text-white placeholder-slate-600 focus:outline-none focus:border-accent"
                        placeholder="e.g. Vercel, GitHub"
                    />
                </div>
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                    <select
                        id="category"
                        name="category"
                        required
                        className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-surface-border text-white focus:outline-none focus:border-accent"
                    >
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat} className="bg-[#0a0a0f]">{cat}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-slate-400 mb-1">Date</label>
                    <input
                        type="date"
                        id="date"
                        name="date"
                        required
                        className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-surface-border text-white focus:outline-none focus:border-accent"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="note" className="block text-sm font-medium text-slate-400 mb-1">Note</label>
                <input
                    type="text"
                    id="note"
                    name="note"
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-surface-border text-white placeholder-slate-600 focus:outline-none focus:border-accent"
                    placeholder="Optional note"
                />
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="recurring"
                    name="recurring"
                    className="rounded bg-white/[0.05] border-surface-border text-accent focus:ring-accent"
                />
                <label htmlFor="recurring" className="text-sm text-slate-400">Recurring expense</label>
            </div>

            <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-lg bg-accent text-black text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
                {submitting ? 'Adding...' : 'Add Expense'}
            </button>
        </form>
    );
}
