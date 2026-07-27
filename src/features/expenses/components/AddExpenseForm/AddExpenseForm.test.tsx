import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { AddExpenseForm } from './AddExpenseForm';

const members: User[] = [
    { id: 'user-1', name: 'Alex Morgan', email: 'alex@example.com' },
    { id: 'user-2', name: 'Priya Sharma', email: 'priya@example.com' },
];

describe('AddExpenseForm', () => {
    it('shows validation errors when submitted without a description or amount', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(<AddExpenseForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

        await user.click(screen.getByRole('button', { name: /add expense/i }));

        expect(await screen.findByText(/description is required/i)).toBeInTheDocument();
        expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows a validation error when the amount is zero', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();

        render(<AddExpenseForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

        await user.type(screen.getByLabelText(/description/i), 'Groceries');
        await user.type(screen.getByLabelText(/amount/i), '0');
        await user.click(screen.getByRole('button', { name: /add expense/i }));

        expect(await screen.findByText(/amount must be greater than zero/i)).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows a validation error when the amount is negative', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();

        render(<AddExpenseForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

        await user.type(screen.getByLabelText(/description/i), 'Groceries');
        await user.type(screen.getByLabelText(/amount/i), '-42.50');
        await user.click(screen.getByRole('button', { name: /add expense/i }));

        expect(await screen.findByText(/amount must be greater than zero/i)).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('defaults to splitting between every group member', () => {
        render(<AddExpenseForm members={members} onSubmit={vi.fn()} onCancel={vi.fn()} />);

        expect(screen.getByRole('checkbox', { name: /alex morgan/i })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: /priya sharma/i })).toBeChecked();
    });

    it('calls onSubmit with the entered values and default participants', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(<AddExpenseForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

        await user.type(screen.getByLabelText(/description/i), 'Groceries');
        await user.type(screen.getByLabelText(/amount/i), '42.50');
        await user.click(screen.getByRole('button', { name: /add expense/i }));

        expect(onSubmit).toHaveBeenCalledWith({
            description: 'Groceries',
            amount: 42.5,
            participantUserIds: ['user-1', 'user-2'],
        });
    });

    it('excludes an unchecked participant from the submitted values', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(<AddExpenseForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

        await user.type(screen.getByLabelText(/description/i), 'Groceries');
        await user.type(screen.getByLabelText(/amount/i), '42.50');
        await user.click(screen.getByRole('checkbox', { name: /priya sharma/i }));
        await user.click(screen.getByRole('button', { name: /add expense/i }));

        expect(onSubmit).toHaveBeenCalledWith({
            description: 'Groceries',
            amount: 42.5,
            participantUserIds: ['user-1'],
        });
    });

    it('shows an error and does not submit when every participant is unchecked', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(<AddExpenseForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

        await user.type(screen.getByLabelText(/description/i), 'Groceries');
        await user.type(screen.getByLabelText(/amount/i), '42.50');
        await user.click(screen.getByRole('checkbox', { name: /alex morgan/i }));
        await user.click(screen.getByRole('checkbox', { name: /priya sharma/i }));
        await user.click(screen.getByRole('button', { name: /add expense/i }));

        expect(await screen.findByText(/select at least one participant/i)).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('calls onCancel when the cancel button is clicked', async () => {
        const onCancel = vi.fn();
        const user = userEvent.setup();
        render(<AddExpenseForm members={members} onSubmit={vi.fn()} onCancel={onCancel} />);

        await user.click(screen.getByRole('button', { name: /cancel/i }));

        expect(onCancel).toHaveBeenCalled();
    });
});
