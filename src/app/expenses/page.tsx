import { getDataClient } from '@/lib/client-factory';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
    const client = getDataClient();
    const [expenses, summary] = await Promise.all([
        client.getExpenses(),
        client.getExpenseSummary(),
    ]);

    const topVendor = Object.entries(summary.byVendor).sort((a, b) => b[1] - a[1])[0];
    const topCategory = Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1])[0];

    return (
        <main className="min-h-[60vh] py-10 space-y-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Expenses</h1>
                <Link
                    href="/expenses/new"
                    className="px-4 py-2 rounded-lg bg-accent text-black text-sm font-semibold hover:bg-accent/90 transition-colors"
                >
                    Add Expense
                </Link>
            </div>

            {/* Summary Cards */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-raised border border-surface-border rounded-2xl p-5">
                    <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-1">Total Expenses</p>
                    <p className="text-white text-2xl font-bold">${summary.totalAmount.toLocaleString()}</p>
                </div>
                <div className="bg-surface-raised border border-surface-border rounded-2xl p-5">
                    <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-1">Count</p>
                    <p className="text-white text-2xl font-bold">{summary.count}</p>
                </div>
                {topVendor && (
                    <div className="bg-surface-raised border border-surface-border rounded-2xl p-5">
                        <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-1">Top Vendor</p>
                        <p className="text-white text-lg font-bold truncate">{topVendor[0]}</p>
                        <p className="text-slate-400 text-sm">${topVendor[1].toLocaleString()}</p>
                    </div>
                )}
                {topCategory && (
                    <div className="bg-surface-raised border border-surface-border rounded-2xl p-5">
                        <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-1">Top Category</p>
                        <p className="text-white text-lg font-bold capitalize">{topCategory[0]}</p>
                        <p className="text-slate-400 text-sm">${topCategory[1].toLocaleString()}</p>
                    </div>
                )}
            </section>

            {/* Expense Table */}
            {expenses.length === 0 ? (
                <div className="bg-surface-raised border border-surface-border rounded-2xl p-10 text-center">
                    <p className="text-slate-500">No expenses yet. Add your first expense to get started.</p>
                </div>
            ) : (
                <div className="bg-surface-raised border border-surface-border rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-surface-border text-left">
                                <th className="px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Date</th>
                                <th className="px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Vendor</th>
                                <th className="px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Category</th>
                                <th className="px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider text-right">Amount</th>
                                <th className="px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Projects</th>
                                <th className="px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Source</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map((expense) => (
                                <tr key={expense.id} className="border-b border-surface-border/50 hover:bg-white/[0.02]">
                                    <td className="px-5 py-3 text-slate-300">{expense.date}</td>
                                    <td className="px-5 py-3 text-white font-medium">{expense.vendor}</td>
                                    <td className="px-5 py-3">
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-300 capitalize">
                                            {expense.category}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right text-rose-400 font-medium">
                                        ${expense.amount.toLocaleString()}
                                    </td>
                                    <td className="px-5 py-3">
                                        {expense.allocations.length === 0 ? (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                                                Unallocated
                                            </span>
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                {expense.allocations.map((a) => (
                                                    <span
                                                        key={a.projectId}
                                                        className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent"
                                                    >
                                                        {a.projectName || a.projectId}
                                                        {a.allocation < 1 && ` (${Math.round(a.allocation * 100)}%)`}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-slate-500 text-xs capitalize">{expense.source}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}
