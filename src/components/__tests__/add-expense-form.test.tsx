import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddExpenseForm } from '../add-expense-form';

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(() => ({
        refresh: jest.fn(),
        push: jest.fn(),
    })),
}));

describe('AddExpenseForm', () => {
    beforeEach(() => {
        global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) as jest.Mock;
    });

    it('renders all form fields', () => {
        render(<AddExpenseForm />);
        expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/vendor/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    });

    it('renders note and recurring fields', () => {
        render(<AddExpenseForm />);
        expect(screen.getByLabelText(/note/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/recurring/i)).toBeInTheDocument();
    });

    it('submits form data to API', async () => {
        render(<AddExpenseForm />);

        fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '50' } });
        fireEvent.change(screen.getByLabelText(/vendor/i), { target: { value: 'AWS' } });
        fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'infrastructure' } });
        fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2025-03-01' } });

        fireEvent.click(screen.getByRole('button', { name: /add expense/i }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/expenses', expect.objectContaining({
                method: 'POST',
            }));
        });
    });
});
