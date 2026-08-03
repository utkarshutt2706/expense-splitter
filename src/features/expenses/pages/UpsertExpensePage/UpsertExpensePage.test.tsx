import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Expense, Group, User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { useCreateExpense } from '@features/expenses/hooks/useCreateExpense';
import { useExpense } from '@features/expenses/hooks/useExpense';
import { useUpdateExpense } from '@features/expenses/hooks/useUpdateExpense';
import { useGroup, useGroupMembers } from '@features/groups';
import { UpsertExpensePage } from './UpsertExpensePage';

const navigateMock = vi.fn();
let paramsMock: { groupId: string; expenseId?: string } = { groupId: 'group-1' };

vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return {
        ...actual,
        useParams: () => paramsMock,
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

vi.mock('@features/expenses/hooks/useCreateExpense', () => ({
    useCreateExpense: vi.fn(),
}));

vi.mock('@features/expenses/hooks/useUpdateExpense', () => ({
    useUpdateExpense: vi.fn(),
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
        data: { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
    }),
}));

const group: Group = {
    id: 'group-1',
    name: 'Daaru Party',
    memberIds: [CURRENT_USER_ID, 'friend-1'],
    createdAt: '',
};

const members: User[] = [
    { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
    { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' },
];

const expense: Expense = {
    id: 'expense-1',
    groupId: 'group-1',
    description: 'Chicken',
    amount: 90,
    paidByUserId: CURRENT_USER_ID,
    splitType: 'equal',
    splits: [
        { userId: CURRENT_USER_ID, amount: 45 },
        { userId: 'friend-1', amount: 45 },
    ],
    createdAt: '2026-07-24T00:00:00.000Z',
};

function renderPage() {
    return render(
        <MemoryRouter>
            <UpsertExpensePage />
        </MemoryRouter>,
    );
}

beforeEach(() => {
    navigateMock.mockClear();
    paramsMock = { groupId: 'group-1' };
    vi.mocked(useGroup).mockReturnValue({ data: group } as unknown as ReturnType<typeof useGroup>);
    vi.mocked(useGroupMembers).mockReturnValue({
        data: members,
        isLoading: false,
    } as unknown as ReturnType<typeof useGroupMembers>);
    vi.mocked(useExpense).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
    } as unknown as ReturnType<typeof useExpense>);
    vi.mocked(useCreateExpense).mockReturnValue({
        mutate: vi.fn(),
    } as unknown as ReturnType<typeof useCreateExpense>);
    vi.mocked(useUpdateExpense).mockReturnValue({
        mutate: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateExpense>);
});

describe('UpsertExpensePage', () => {
    describe('add mode', () => {
        it('shows the add-expense heading and a link back to the group', () => {
            renderPage();

            expect(screen.getByRole('heading', { name: 'Add an expense' })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /back to group/i })).toHaveAttribute(
                'href',
                '/groups/group-1',
            );
        });

        it('shows a loading skeleton while group members are still loading', () => {
            vi.mocked(useGroupMembers).mockReturnValue({
                data: undefined,
                isLoading: true,
            } as unknown as ReturnType<typeof useGroupMembers>);

            renderPage();

            expect(screen.getByRole('status', { name: /loading group/i })).toBeInTheDocument();
        });

        it('creates the expense, shows a toast, and navigates back to the group on success', async () => {
            let onSuccess: (() => void) | undefined;
            const mutate = vi.fn((_values, options: { onSuccess?: () => void }) => {
                onSuccess = options.onSuccess;
            });
            vi.mocked(useCreateExpense).mockReturnValue({
                mutate,
            } as unknown as ReturnType<typeof useCreateExpense>);
            const user = userEvent.setup();
            renderPage();

            await user.type(screen.getByLabelText(/description/i), 'Groceries');
            await user.type(screen.getByLabelText(/amount/i), '42.50');
            await user.click(screen.getByRole('button', { name: /add expense/i }));

            expect(toast.loading).toHaveBeenCalledWith('Expense is being added…');
            expect(mutate).toHaveBeenCalledWith(
                expect.objectContaining({ groupId: 'group-1', description: 'Groceries' }),
                expect.anything(),
            );

            onSuccess?.();

            expect(toast.success).toHaveBeenCalledWith('Expense added', { id: 'toast-id' });
            expect(navigateMock).toHaveBeenCalledWith('/groups/group-1');
        });

        it('shows an error toast and does not navigate when adding fails', async () => {
            let onError: ((error: Error) => void) | undefined;
            const mutate = vi.fn((_values, options: { onError?: (error: Error) => void }) => {
                onError = options.onError;
            });
            vi.mocked(useCreateExpense).mockReturnValue({
                mutate,
            } as unknown as ReturnType<typeof useCreateExpense>);
            const user = userEvent.setup();
            renderPage();

            await user.type(screen.getByLabelText(/description/i), 'Groceries');
            await user.type(screen.getByLabelText(/amount/i), '42.50');
            await user.click(screen.getByRole('button', { name: /add expense/i }));
            onError?.(new Error('Something went wrong'));

            expect(toast.error).toHaveBeenCalledWith('Something went wrong', { id: 'toast-id' });
            expect(navigateMock).not.toHaveBeenCalled();
        });

        it('navigates back to the group when cancelled', async () => {
            const user = userEvent.setup();
            renderPage();

            await user.click(screen.getByRole('button', { name: /cancel/i }));

            expect(navigateMock).toHaveBeenCalledWith('/groups/group-1');
        });
    });

    describe('edit mode', () => {
        beforeEach(() => {
            paramsMock = { groupId: 'group-1', expenseId: 'expense-1' };
        });

        it('shows the edit-expense heading and a link back to the expense', () => {
            vi.mocked(useExpense).mockReturnValue({
                data: expense,
                isLoading: false,
                isError: false,
            } as unknown as ReturnType<typeof useExpense>);

            renderPage();

            expect(screen.getByRole('heading', { name: 'Edit expense' })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /back to expense/i })).toHaveAttribute(
                'href',
                '/groups/group-1/expenses/expense-1',
            );
        });

        it('shows a loading skeleton while the expense is still loading', () => {
            vi.mocked(useExpense).mockReturnValue({
                data: undefined,
                isLoading: true,
                isError: false,
            } as unknown as ReturnType<typeof useExpense>);

            renderPage();

            expect(screen.getByRole('status', { name: /loading expense/i })).toBeInTheDocument();
        });

        it("shows an error message when the expense can't be loaded", () => {
            vi.mocked(useExpense).mockReturnValue({
                data: undefined,
                isLoading: false,
                isError: true,
            } as unknown as ReturnType<typeof useExpense>);

            renderPage();

            expect(screen.getByText(/couldn't load this expense/i)).toBeInTheDocument();
        });

        it('prefills the form with the existing expense', () => {
            vi.mocked(useExpense).mockReturnValue({
                data: expense,
                isLoading: false,
                isError: false,
            } as unknown as ReturnType<typeof useExpense>);

            renderPage();

            expect(screen.getByLabelText(/description/i)).toHaveValue('Chicken');
            expect(screen.getByLabelText(/^amount$/i)).toHaveValue(90);
        });

        it('updates the expense, shows a toast, and navigates back to the expense on success', async () => {
            vi.mocked(useExpense).mockReturnValue({
                data: expense,
                isLoading: false,
                isError: false,
            } as unknown as ReturnType<typeof useExpense>);
            let onSuccess: (() => void) | undefined;
            const mutate = vi.fn((_values, options: { onSuccess?: () => void }) => {
                onSuccess = options.onSuccess;
            });
            vi.mocked(useUpdateExpense).mockReturnValue({
                mutate,
            } as unknown as ReturnType<typeof useUpdateExpense>);
            const user = userEvent.setup();
            renderPage();

            await user.clear(screen.getByLabelText(/description/i));
            await user.type(screen.getByLabelText(/description/i), 'Dinner');
            await user.click(screen.getByRole('button', { name: /save changes/i }));

            expect(toast.loading).toHaveBeenCalledWith('Expense is being updated…');
            expect(mutate).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'expense-1',
                    groupId: 'group-1',
                    description: 'Dinner',
                }),
                expect.anything(),
            );

            onSuccess?.();

            expect(toast.success).toHaveBeenCalledWith('Expense updated', { id: 'toast-id' });
            expect(navigateMock).toHaveBeenCalledWith('/groups/group-1/expenses/expense-1');
        });

        it('navigates back to the expense when cancelled', async () => {
            vi.mocked(useExpense).mockReturnValue({
                data: expense,
                isLoading: false,
                isError: false,
            } as unknown as ReturnType<typeof useExpense>);
            const user = userEvent.setup();
            renderPage();

            await user.click(screen.getByRole('button', { name: /cancel/i }));

            expect(navigateMock).toHaveBeenCalledWith('/groups/group-1/expenses/expense-1');
        });
    });
});
