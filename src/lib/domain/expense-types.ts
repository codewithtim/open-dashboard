export type ExpenseCategory = 'infrastructure' | 'tooling' | 'services' | 'marketing' | 'legal' | 'other';

export type ExpenseSource = 'manual' | 'email' | 'api';

export interface CostAllocation {
    projectId: string;
    projectName?: string;
    allocation: number;
}

export interface Expense {
    id: string;
    amount: number;
    vendor: string;
    category: ExpenseCategory;
    note?: string;
    date: string;
    periodStart?: string;
    periodEnd?: string;
    source: ExpenseSource;
    sourceRef?: string;
    recurring: boolean;
    currency: string;
    createdAt: string;
    allocations: CostAllocation[];
}

export interface ExpenseSummary {
    totalAmount: number;
    count: number;
    byCategory: Record<string, number>;
    byVendor: Record<string, number>;
}

export interface ProjectService {
    id: string;
    projectId: string;
    vendor: string;
    exclusive: boolean;
}

export interface CreateExpenseInput {
    amount: number;
    vendor: string;
    category: ExpenseCategory;
    note?: string;
    date: string;
    periodStart?: string;
    periodEnd?: string;
    source?: ExpenseSource;
    sourceRef?: string;
    recurring?: boolean;
    currency?: string;
}
