import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getDataClient } from '@/lib/client-factory';
import { linkCostToProjects } from '@/lib/domain/cost-linker';
import type { ExpenseCategory, CostAllocation } from '@/lib/data-client';

const VALID_CATEGORIES: ExpenseCategory[] = ['infrastructure', 'tooling', 'services', 'marketing', 'legal', 'other'];

export async function GET() {
    const client = getDataClient();
    const expenses = await client.getExpenses();
    return NextResponse.json(expenses);
}

export async function POST(req: Request) {
    const body = await req.json();
    const { amount, vendor, category, date, allocations: manualAllocations, ...rest } = body;

    if (!amount || !vendor || !date) {
        return NextResponse.json({ error: 'amount, vendor, and date are required' }, { status: 400 });
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
        return NextResponse.json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` }, { status: 400 });
    }

    const client = getDataClient();

    let allocations: CostAllocation[];
    if (manualAllocations && Array.isArray(manualAllocations) && manualAllocations.length > 0) {
        allocations = manualAllocations;
    } else {
        const allServices = await client.getAllProjectServices();
        allocations = linkCostToProjects(vendor, allServices);
    }

    const input = { amount, vendor, category, date, ...rest };
    const expense = await client.createExpense(input, allocations);

    revalidatePath('/');
    revalidatePath('/expenses');

    return NextResponse.json(expense, { status: 201 });
}
