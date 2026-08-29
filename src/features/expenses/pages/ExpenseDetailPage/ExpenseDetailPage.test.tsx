import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Expense, Group, User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { useDeleteExpense } from '@features/expenses/hooks/useDeleteExpense';
import { useExpense } from '@features/expenses/hooks/useExpense';
import { useGroup, useGroupMembers } from '@features/groups';
import { ExpenseDetailPage } from './ExpenseDetailPage';

const navigateMock = vi.fn();

vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return {
        ...actual,
        useParams: () => ({ groupId: 'group-1', expenseId: 'expense-1' }),
        useNavigate: () => navigateMock,
    };
});

vi.mock('@features/groups', () => ({
    useGroup: vi.fn(),
    useGroupMembers: vi.fn(),
}));

vi.mock('@features/expenses/hooks/useExpense', () => ({
    useExpense: vi.fn(),
}));

vi.mock('@features/expenses/hooks/useDeleteExpense', () => ({
    useDeleteExpense: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: {
        loading: vi.fn(() => 'toast-id'),
        success: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('@app/hooks', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/hooks')>()),
    useCurrentUser: () => ({
        data: { id: CURRENT_USER_ID, name: 'Utkarsh Srivastava', email: 'utkarsh@example.com' },
    }),
}));

const group: Group = {
    id: 'group-1',
    name: 'Daaru Party',
    memberIds: [CURRENT_USER_ID, 'friend-1', 'friend-2'],
    createdAt: '',
};

const members: User[] = [
    { id: CURRENT_USER_ID, name: 'Utkarsh Srivastava', email: 'utkarsh@example.com' },
    { id: 'friend-1', name: 'Abhinav', email: 'abhinav@example.com' },
    { id: 'friend-2', name: 'Khem', email: 'khem@example.com' },
];

const expense: Expense = {
    id: 'expense-1',
    groupId: 'group-1',
    description: 'Chicken',
    amount: 90,
    paidByUserId: CURRENT_USER_ID,
    createdByUserId: 'friend-1',
    splitType: 'equal',
    splits: [
        { userId: CURRENT_USER_ID, amount: 45 },
        { userId: 'friend-1', amount: 45 },
    ],
    paidOn: '2026-07-23T00:00:00.000Z',
    createdAt: '2026-07-24T00:00:00.000Z',
};

function renderPage() {
    return render(
        <MemoryRouter>
            <ExpenseDetailPage />
        </MemoryRouter>,
    );
}

function mockLoadedExpense(data: Expense, memberList: User[] = members) {
    vi.mocked(useExpense).mockReturnValue({
        data,
        isLoading: false,
        isError: false,
    } as unknown as ReturnType<typeof useExpense>);
    vi.mocked(useGroup).mockReturnValue({
        data: group,
        isLoading: false,
    } as unknown as ReturnType<typeof useGroup>);
    vi.mocked(useGroupMembers).mockReturnValue({
        data: memberList,
        isLoading: false,
    } as unknown as ReturnType<typeof useGroupMembers>);
}

beforeEach(() => {
    navigateMock.mockClear();
    vi.mocked(useDeleteExpense).mockReturnValue({
        mutate: vi.fn(),
    } as unknown as ReturnType<typeof useDeleteExpense>);
});

describe('ExpenseDetailPage', () => {
    it('shows a loading message while fetching', () => {
        vi.mocked(useExpense).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useExpense>);
        vi.mocked(useGroup).mockReturnValue({
            data: undefined,
            isLoading: true,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: [],
            isLoading: true,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByRole('status', { name: /loading expense/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /edit expense/i })).toBeDisabled();
        expect(screen.queryByRole('link', { name: /edit expense/i })).not.toBeInTheDocument();
    });

    it('shows an error message when the expense fails to load', () => {
        vi.mocked(useExpense).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        } as unknown as ReturnType<typeof useExpense>);
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: members,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByText(/couldn't load this expense/i)).toBeInTheDocument();
    });

    it('renders the back link and expense title once loaded', () => {
        vi.mocked(useExpense).mockReturnValue({
            data: expense,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpense>);
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: members,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByRole('link', { name: /back to group/i })).toHaveAttribute(
            'href',
            '/groups/group-1',
        );
        expect(screen.getByRole('heading', { name: 'Chicken' })).toBeInTheDocument();
    });

    it('shows a refreshing indicator during a background refetch, not the loading skeleton', () => {
        vi.mocked(useExpense).mockReturnValue({
            data: expense,
            isLoading: false,
            isFetching: true,
            isError: false,
        } as unknown as ReturnType<typeof useExpense>);
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: members,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByRole('status', { name: 'Refreshing…' })).toBeInTheDocument();
        expect(screen.queryByRole('status', { name: /loading expense/i })).not.toBeInTheDocument();
    });

    it('does not show a refreshing indicator once the background refetch settles', () => {
        vi.mocked(useExpense).mockReturnValue({
            data: expense,
            isLoading: false,
            isFetching: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpense>);
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: members,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.queryByRole('status', { name: 'Refreshing…' })).not.toBeInTheDocument();
    });

    it('shows the amount and who added the expense, with the added date', () => {
        vi.mocked(useExpense).mockReturnValue({
            data: expense,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpense>);
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: members,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByText('₹90.00')).toBeInTheDocument();
        expect(screen.getByText('Added by Abhinav on Jul 24, 2026')).toBeInTheDocument();
    });

    it('shows who paid, the amount, and the paid date as a heading above the split breakdown', () => {
        vi.mocked(useExpense).mockReturnValue({
            data: expense,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpense>);
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: members,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByText('You paid ₹90.00')).toBeInTheDocument();
        expect(screen.getByText('on Jul 23, 2026')).toBeInTheDocument();
    });

    it('lists each participant with their share, omitting uninvolved members', () => {
        vi.mocked(useExpense).mockReturnValue({
            data: expense,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpense>);
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: members,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByText('Your share ₹45.00')).toBeInTheDocument();
        expect(screen.getByText('Abhinav’s share ₹45.00')).toBeInTheDocument();
        expect(screen.getByText('You covered ₹45.00 for others.')).toBeInTheDocument();
        expect(screen.queryByText(/you owe|abhinav owes/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/khem/i)).not.toBeInTheDocument();
    });

    it('explains when another participant covered part of the expense', () => {
        mockLoadedExpense({ ...expense, paidByUserId: 'friend-1' });

        renderPage();

        expect(screen.getByText('Abhinav paid ₹90.00')).toBeInTheDocument();
        expect(screen.getByText('Your share ₹45.00')).toBeInTheDocument();
        expect(screen.getByText('Abhinav’s share ₹45.00')).toBeInTheDocument();
        expect(screen.getByText('Abhinav covered ₹45.00 for others.')).toBeInTheDocument();
    });

    it('does not show a covered summary when the payer funded only their own share', () => {
        mockLoadedExpense({
            ...expense,
            amount: 90,
            splits: [{ userId: CURRENT_USER_ID, amount: 90 }],
        });

        renderPage();

        expect(screen.getByText('Your share ₹90.00')).toBeInTheDocument();
        expect(screen.queryByText(/covered .* for others/i)).not.toBeInTheDocument();
    });

    it('does not infer coverage when the payer has no stored split', () => {
        mockLoadedExpense({
            ...expense,
            splits: [{ userId: 'friend-1', amount: 90 }],
        });

        renderPage();

        expect(screen.getByText('Abhinav’s share ₹90.00')).toBeInTheDocument();
        expect(screen.queryByText(/covered .* for others/i)).not.toBeInTheDocument();
    });

    it('shows every included unequal share once and calculates coverage in cents', () => {
        mockLoadedExpense({
            ...expense,
            amount: 100,
            splits: [
                { userId: CURRENT_USER_ID, amount: 33.33 },
                { userId: 'friend-1', amount: 33.33 },
                { userId: 'friend-2', amount: 33.34 },
            ],
        });

        renderPage();

        expect(screen.getAllByText('Your share ₹33.33')).toHaveLength(1);
        expect(screen.getAllByText('Abhinav’s share ₹33.33')).toHaveLength(1);
        expect(screen.getAllByText('Khem’s share ₹33.34')).toHaveLength(1);
        expect(screen.getByText('You covered ₹66.67 for others.')).toBeInTheDocument();
    });

    it.each(['percentage', 'shares'] as const)(
        'displays resolved monetary shares for a %s expense',
        (splitType) => {
            mockLoadedExpense({ ...expense, splitType });

            renderPage();

            expect(screen.getByText('Your share ₹45.00')).toBeInTheDocument();
            expect(screen.getByText('Abhinav’s share ₹45.00')).toBeInTheDocument();
        },
    );

    it('uses neutral share wording for a participant name ending in s', () => {
        const chris = { id: 'friend-1', name: 'Chris', email: 'chris@example.com' };
        mockLoadedExpense(expense, [members[0]!, chris]);

        renderPage();

        expect(screen.getByText('Share for Chris ₹45.00')).toBeInTheDocument();
    });

    it('shows the current user share before the other participant shares', () => {
        mockLoadedExpense(expense, [members[1]!, members[0]!]);

        renderPage();

        const shareRows = screen.getAllByRole('listitem');
        expect(shareRows[0]).toHaveTextContent('Your share ₹45.00');
        expect(shareRows[1]).toHaveTextContent('Abhinav’s share ₹45.00');
    });

    it('renders an edit expense button', () => {
        vi.mocked(useExpense).mockReturnValue({
            data: expense,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpense>);
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: members,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByRole('link', { name: /edit expense/i })).toHaveAttribute(
            'href',
            '/groups/group-1/expenses/expense-1/edit',
        );
    });

    it('renders a delete expense button', () => {
        vi.mocked(useExpense).mockReturnValue({
            data: expense,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpense>);
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: members,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByRole('button', { name: /delete expense/i })).toBeInTheDocument();
    });

    describe('deleting the expense', () => {
        beforeEach(() => {
            vi.mocked(useExpense).mockReturnValue({
                data: expense,
                isLoading: false,
                isError: false,
            } as unknown as ReturnType<typeof useExpense>);
            vi.mocked(useGroup).mockReturnValue({
                data: group,
                isLoading: false,
            } as unknown as ReturnType<typeof useGroup>);
            vi.mocked(useGroupMembers).mockReturnValue({
                data: members,
                isLoading: false,
            } as unknown as ReturnType<typeof useGroupMembers>);
        });

        it('shows a confirmation dialog when the delete button is clicked', async () => {
            const mutate = vi.fn();
            vi.mocked(useDeleteExpense).mockReturnValue({
                mutate,
                isPending: false,
            } as unknown as ReturnType<typeof useDeleteExpense>);
            const user = userEvent.setup();
            renderPage();

            const trigger = screen.getByRole('button', { name: /delete expense/i });
            await user.click(trigger);

            expect(
                screen.getByRole('alertdialog', { name: 'Delete expense?' }),
            ).toBeInTheDocument();
            expect(screen.getByText(/permanently delete “Chicken” for ₹90\.00/i)).toHaveTextContent(
                'from Daaru Party',
            );
            expect(screen.getByText(/remove everyone’s shares/i)).toHaveTextContent(
                /recalculate the group’s balances.*cannot be undone/i,
            );
            expect(mutate).not.toHaveBeenCalled();
            await waitFor(() =>
                expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus(),
            );
        });

        it('does not delete when the confirmation is dismissed', async () => {
            const mutate = vi.fn();
            vi.mocked(useDeleteExpense).mockReturnValue({
                mutate,
            } as unknown as ReturnType<typeof useDeleteExpense>);
            const user = userEvent.setup();
            renderPage();

            await user.click(screen.getByRole('button', { name: /delete expense/i }));
            await user.click(screen.getByRole('button', { name: /cancel/i }));

            expect(mutate).not.toHaveBeenCalled();
            expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
            await waitFor(() =>
                expect(screen.getByRole('button', { name: /delete expense/i })).toHaveFocus(),
            );
        });

        it('dismisses with Escape without deleting', async () => {
            const mutate = vi.fn();
            vi.mocked(useDeleteExpense).mockReturnValue({
                mutate,
                isPending: false,
            } as unknown as ReturnType<typeof useDeleteExpense>);
            const user = userEvent.setup();
            renderPage();

            await user.click(screen.getByRole('button', { name: /delete expense/i }));
            await user.keyboard('{Escape}');

            expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
            expect(mutate).not.toHaveBeenCalled();
        });

        it('deletes the expense, shows a toast, and navigates back to the group on confirm', async () => {
            let onSuccess: (() => void) | undefined;
            const mutate = vi.fn((_values, options: { onSuccess?: () => void }) => {
                onSuccess = options.onSuccess;
            });
            vi.mocked(useDeleteExpense).mockReturnValue({
                mutate,
            } as unknown as ReturnType<typeof useDeleteExpense>);
            const user = userEvent.setup();
            renderPage();

            await user.click(screen.getByRole('button', { name: /delete expense/i }));
            await user.click(screen.getByRole('button', { name: 'Delete expense' }));

            expect(toast.loading).toHaveBeenCalledWith('Expense is being deleted…');
            expect(mutate).toHaveBeenCalledWith(
                { id: 'expense-1', groupId: 'group-1' },
                expect.anything(),
            );

            onSuccess?.();

            expect(toast.success).toHaveBeenCalledWith('Expense deleted', { id: 'toast-id' });
            expect(navigateMock).toHaveBeenCalledWith('/groups/group-1');
        });

        it('keeps the dialog open and disables both actions while deletion is pending', async () => {
            const mutate = vi.fn();
            vi.mocked(useDeleteExpense).mockReturnValue({
                mutate,
                isPending: false,
            } as unknown as ReturnType<typeof useDeleteExpense>);
            const user = userEvent.setup();
            const view = renderPage();

            await user.click(screen.getByRole('button', { name: /delete expense/i }));
            await user.click(screen.getByRole('button', { name: 'Delete expense' }));

            vi.mocked(useDeleteExpense).mockReturnValue({
                mutate,
                isPending: true,
            } as unknown as ReturnType<typeof useDeleteExpense>);
            view.rerender(
                <MemoryRouter>
                    <ExpenseDetailPage />
                </MemoryRouter>,
            );

            expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled();
            expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
            await user.click(screen.getByRole('button', { name: 'Deleting…' }));
            expect(mutate).toHaveBeenCalledTimes(1);
        });

        it('shows an error toast when deletion fails', async () => {
            let onError: ((error: Error) => void) | undefined;
            const mutate = vi.fn((_values, options: { onError?: (error: Error) => void }) => {
                onError = options.onError;
            });
            vi.mocked(useDeleteExpense).mockReturnValue({
                mutate,
            } as unknown as ReturnType<typeof useDeleteExpense>);
            const user = userEvent.setup();
            renderPage();

            await user.click(screen.getByRole('button', { name: /delete expense/i }));
            await user.click(screen.getByRole('button', { name: 'Delete expense' }));
            act(() => onError?.(new Error('Something went wrong')));

            expect(screen.getByRole('alertdialog')).toBeInTheDocument();
            expect(screen.getByRole('alert')).toHaveTextContent(
                'We couldn’t delete this expense. Nothing was changed. Try again.',
            );
            expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
            expect(toast.error).toHaveBeenCalledWith(
                'We couldn’t delete this expense. Nothing was changed. Try again.',
                { id: 'toast-id' },
            );
            expect(navigateMock).not.toHaveBeenCalled();
        });
    });

    it('orders split participants alphabetically with the current user first', () => {
        const roster: User[] = [
            { id: 'friend-3', name: 'Zoe Tan' },
            { id: 'friend-1', name: 'Priya Sharma' },
            { id: CURRENT_USER_ID, name: 'Utkarsh Srivastava' },
            { id: 'friend-2', name: 'Arun Nair' },
        ];
        mockLoadedExpense(
            {
                ...expense,
                splits: [
                    { userId: 'friend-3', amount: 25 },
                    { userId: 'friend-1', amount: 25 },
                    { userId: CURRENT_USER_ID, amount: 20 },
                    { userId: 'friend-2', amount: 20 },
                ],
            },
            roster,
        );

        renderPage();

        const shares = screen
            .getAllByText(/share/i)
            .map((node) => node.textContent?.replace(/\s*₹.*$/, '') ?? '');
        expect(shares).toEqual(['Your share', 'Arun’s share', 'Priya’s share', 'Zoe’s share']);
    });
});
