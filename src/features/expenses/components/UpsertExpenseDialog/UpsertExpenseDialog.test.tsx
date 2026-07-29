import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { UpsertExpenseDialog } from './UpsertExpenseDialog';

vi.mock('../UpsertExpenseForm', () => ({
    UpsertExpenseForm: ({
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
        <div data-testid="upsert-expense-form">
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

describe('UpsertExpenseDialog', () => {
    it('does not render the form when closed', () => {
        render(
            <UpsertExpenseDialog
                open={false}
                onOpenChange={vi.fn()}
                members={[]}
                onSubmit={vi.fn()}
            />,
        );

        expect(screen.queryByTestId('upsert-expense-form')).not.toBeInTheDocument();
    });

    it('renders the form when open', () => {
        render(<UpsertExpenseDialog open onOpenChange={vi.fn()} members={[]} onSubmit={vi.fn()} />);

        expect(screen.getByTestId('upsert-expense-form')).toBeInTheDocument();
        expect(screen.getByText(/add an expense/i)).toBeInTheDocument();
    });

    it('reports closed when the close button is clicked', async () => {
        const onOpenChange = vi.fn();
        const user = userEvent.setup();
        render(
            <UpsertExpenseDialog
                open
                onOpenChange={onOpenChange}
                members={[]}
                onSubmit={vi.fn()}
            />,
        );

        await user.click(screen.getByRole('button', { name: /close/i }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('reports closed when the form reports cancel', async () => {
        const onOpenChange = vi.fn();
        const user = userEvent.setup();
        render(
            <UpsertExpenseDialog
                open
                onOpenChange={onOpenChange}
                members={[]}
                onSubmit={vi.fn()}
            />,
        );

        await user.click(screen.getByRole('button', { name: /fake cancel/i }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('shows an edit title and description in edit mode', () => {
        render(
            <UpsertExpenseDialog
                mode="edit"
                open
                onOpenChange={vi.fn()}
                members={[]}
                onSubmit={vi.fn()}
            />,
        );

        expect(screen.getByText(/edit expense/i)).toBeInTheDocument();
    });

    it('reports closed and forwards the values when the form submits', async () => {
        const onOpenChange = vi.fn();
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(
            <UpsertExpenseDialog
                open
                onOpenChange={onOpenChange}
                members={[]}
                onSubmit={onSubmit}
            />,
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
