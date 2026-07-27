import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AddExpenseDialog } from './AddExpenseDialog';

vi.mock('../AddExpenseForm', () => ({
    AddExpenseForm: ({
        onSubmit,
        onCancel,
    }: {
        onSubmit: (values: {
            description: string;
            amount: number;
            paidByUserId: string;
            participantUserIds: string[];
        }) => void;
        onCancel: () => void;
    }) => (
        <div data-testid="add-expense-form">
            <button
                type="button"
                onClick={() =>
                    onSubmit({
                        description: 'Groceries',
                        amount: 42.5,
                        paidByUserId: 'user-1',
                        participantUserIds: ['user-1'],
                    })
                }
            >
                Fake submit
            </button>
            <button type="button" onClick={onCancel}>
                Fake cancel
            </button>
        </div>
    ),
}));

describe('AddExpenseDialog', () => {
    it('does not render the form when closed', () => {
        render(
            <AddExpenseDialog
                open={false}
                onOpenChange={vi.fn()}
                members={[]}
                onSubmit={vi.fn()}
            />,
        );

        expect(screen.queryByTestId('add-expense-form')).not.toBeInTheDocument();
    });

    it('renders the form when open', () => {
        render(<AddExpenseDialog open onOpenChange={vi.fn()} members={[]} onSubmit={vi.fn()} />);

        expect(screen.getByTestId('add-expense-form')).toBeInTheDocument();
        expect(screen.getByText(/add an expense/i)).toBeInTheDocument();
    });

    it('reports closed when the close button is clicked', async () => {
        const onOpenChange = vi.fn();
        const user = userEvent.setup();
        render(
            <AddExpenseDialog open onOpenChange={onOpenChange} members={[]} onSubmit={vi.fn()} />,
        );

        await user.click(screen.getByRole('button', { name: /close/i }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('reports closed when the form reports cancel', async () => {
        const onOpenChange = vi.fn();
        const user = userEvent.setup();
        render(
            <AddExpenseDialog open onOpenChange={onOpenChange} members={[]} onSubmit={vi.fn()} />,
        );

        await user.click(screen.getByRole('button', { name: /fake cancel/i }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('reports closed and forwards the values when the form submits', async () => {
        const onOpenChange = vi.fn();
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(
            <AddExpenseDialog open onOpenChange={onOpenChange} members={[]} onSubmit={onSubmit} />,
        );

        await user.click(screen.getByRole('button', { name: /fake submit/i }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(onSubmit).toHaveBeenCalledWith({
            description: 'Groceries',
            amount: 42.5,
            paidByUserId: 'user-1',
            participantUserIds: ['user-1'],
        });
    });
});
