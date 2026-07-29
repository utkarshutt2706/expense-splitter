import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { useCreateExpense } from '@features/expenses/hooks/useCreateExpense';
import { AddExpenseAction } from './AddExpenseAction';

vi.mock('@features/expenses/hooks/useCreateExpense', () => ({
    useCreateExpense: vi.fn(),
}));

vi.mock('../AddExpenseDialog', () => ({
    AddExpenseDialog: ({
        onSubmit,
    }: {
        onSubmit: (values: {
            description: string;
            amount: number;
            paidByUserId: string;
            participantUserIds: string[];
            splitType: 'equal';
        }) => void;
    }) => (
        <div data-testid="add-expense-dialog">
            <button
                type="button"
                onClick={() =>
                    onSubmit({
                        description: 'Groceries',
                        amount: 42.5,
                        paidByUserId: 'current-user',
                        participantUserIds: ['friend-1'],
                        splitType: 'equal',
                    })
                }
            >
                Fake add expense submit
            </button>
        </div>
    ),
}));

vi.mock('sonner', () => ({
    toast: {
        loading: vi.fn(() => 'toast-id'),
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const members: User[] = [{ id: 'current-user', name: 'Alex Morgan', email: 'alex@example.com' }];

describe('AddExpenseAction', () => {
    beforeEach(() => {
        vi.mocked(useCreateExpense).mockReturnValue({
            mutate: vi.fn(),
        } as unknown as ReturnType<typeof useCreateExpense>);
    });

    it('renders the add expense button when the group has members', () => {
        render(<AddExpenseAction groupId="group-1" members={members} />);

        expect(screen.getByRole('button', { name: 'Add expense' })).toBeInTheDocument();
    });

    it('hides the add expense button when the group has no members', () => {
        render(<AddExpenseAction groupId="group-1" members={[]} />);

        expect(screen.queryByRole('button', { name: 'Add expense' })).not.toBeInTheDocument();
    });

    it('adds an expense and shows a loading toast, then success', async () => {
        let onSuccess: (() => void) | undefined;
        const mutate = vi.fn((_values, options: { onSuccess?: () => void }) => {
            onSuccess = options.onSuccess;
        });
        vi.mocked(useCreateExpense).mockReturnValue({
            mutate,
        } as unknown as ReturnType<typeof useCreateExpense>);

        const user = userEvent.setup();
        render(<AddExpenseAction groupId="group-1" members={members} />);

        await user.click(screen.getByRole('button', { name: /fake add expense submit/i }));

        expect(toast.loading).toHaveBeenCalledWith('Expense is being added…');
        expect(mutate).toHaveBeenCalledWith(
            {
                groupId: 'group-1',
                description: 'Groceries',
                amount: 42.5,
                paidByUserId: 'current-user',
                participantUserIds: ['friend-1'],
                splitType: 'equal',
                exactSplits: undefined,
            },
            expect.anything(),
        );

        act(() => onSuccess?.());

        expect(toast.success).toHaveBeenCalledWith('Expense added', { id: 'toast-id' });
    });

    it('shows an error toast when adding an expense fails', async () => {
        let onError: ((error: Error) => void) | undefined;
        const mutate = vi.fn((_values, options: { onError?: (error: Error) => void }) => {
            onError = options.onError;
        });
        vi.mocked(useCreateExpense).mockReturnValue({
            mutate,
        } as unknown as ReturnType<typeof useCreateExpense>);

        const user = userEvent.setup();
        render(<AddExpenseAction groupId="group-1" members={members} />);

        await user.click(screen.getByRole('button', { name: /fake add expense submit/i }));
        onError?.(new Error('Something went wrong'));

        expect(toast.error).toHaveBeenCalledWith('Something went wrong', { id: 'toast-id' });
    });
});
