import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Expense } from '@features/expenses/api/expensesApi';
import type { Group } from '@features/groups/api/groupsApi';
import type { User } from '@features/users/api/usersApi';
import { useDeleteExpense } from '@features/expenses/hooks/useDeleteExpense';
import { useExpense } from '@features/expenses/hooks/useExpense';
import { useGroup, useGroupMembers } from '@features/groups';

import { useExpenseDetailPage } from './useExpenseDetailPage';

const { navigateMock, toastLoadingMock, toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
    navigateMock: vi.fn(),
    toastLoadingMock: vi.fn(() => 'toast-id'),
    toastSuccessMock: vi.fn(),
    toastErrorMock: vi.fn(),
}));

vi.mock('react-router', () => ({
    useParams: () => ({ groupId: 'group-1', expenseId: 'expense-1' }),
    useNavigate: () => navigateMock,
}));

vi.mock('@app/hooks', () => ({
    useCurrentUser: () => ({ data: { id: 'current', name: 'Current User' } }),
}));

vi.mock('@features/groups', () => ({
    useGroup: vi.fn(),
    useGroupMembers: vi.fn(),
}));

vi.mock('@features/expenses/hooks/useExpense', () => ({ useExpense: vi.fn() }));
vi.mock('@features/expenses/hooks/useDeleteExpense', () => ({ useDeleteExpense: vi.fn() }));
vi.mock('sonner', () => ({
    toast: {
        loading: toastLoadingMock,
        success: toastSuccessMock,
        error: toastErrorMock,
    },
}));

const expense = {
    id: 'expense-1',
    groupId: 'group-1',
    description: 'Dinner',
} as Expense;
const group = { id: 'group-1', name: 'Trip', memberIds: ['current', 'friend'] } as Group;
const members = [
    { id: 'current', name: 'Current User' },
    { id: 'friend', name: 'Friend User' },
] as User[];

function mockDependencies(
    overrides: {
        expense?: Record<string, unknown>;
        group?: Record<string, unknown>;
        members?: Record<string, unknown>;
        deletion?: Record<string, unknown>;
    } = {},
) {
    vi.mocked(useExpense).mockReturnValue({
        data: expense,
        isLoading: false,
        isFetching: false,
        isError: false,
        ...overrides.expense,
    } as unknown as ReturnType<typeof useExpense>);
    vi.mocked(useGroup).mockReturnValue({
        data: group,
        isLoading: false,
        ...overrides.group,
    } as unknown as ReturnType<typeof useGroup>);
    vi.mocked(useGroupMembers).mockReturnValue({
        data: members,
        isLoading: false,
        ...overrides.members,
    } as unknown as ReturnType<typeof useGroupMembers>);
    vi.mocked(useDeleteExpense).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        ...overrides.deletion,
    } as unknown as ReturnType<typeof useDeleteExpense>);
}

describe('useExpenseDetailPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockDependencies();
    });

    it('loads the route expense, group, members, and current user', () => {
        const { result } = renderHook(() => useExpenseDetailPage());

        expect(useExpense).toHaveBeenCalledWith('group-1', 'expense-1');
        expect(useGroup).toHaveBeenCalledWith('group-1');
        expect(useGroupMembers).toHaveBeenCalledWith(['current', 'friend']);
        expect(result.current).toMatchObject({
            currentUserId: 'current',
            expense,
            expenseId: 'expense-1',
            group,
            groupId: 'group-1',
            members,
            isLoading: false,
            isRefreshing: false,
            isExpenseError: false,
            isDeletePending: false,
        });
    });

    it('combines loading state and only reports background fetching as refreshing', () => {
        mockDependencies({ expense: { isLoading: false, isFetching: true } });
        const first = renderHook(() => useExpenseDetailPage());
        expect(first.result.current).toMatchObject({ isLoading: false, isRefreshing: true });
        first.unmount();

        mockDependencies({
            expense: { isLoading: false, isFetching: true },
            members: { isLoading: true },
        });
        const second = renderHook(() => useExpenseDetailPage());
        expect(second.result.current).toMatchObject({ isLoading: true, isRefreshing: false });
    });

    it('opens and closes the confirmation dialog while clearing stale errors', async () => {
        let onError: (() => void) | undefined;
        mockDependencies({
            deletion: {
                mutate: vi.fn((_input, options: { onError: () => void }) => {
                    onError = options.onError;
                }),
            },
        });
        const { result } = renderHook(() => useExpenseDetailPage());
        act(() => result.current.openDeleteDialog());
        act(() => result.current.handleDelete());
        act(() => onError?.());
        expect(result.current.deleteError).toBeDefined();

        act(() => result.current.setDeleteDialogOpen(false));
        await act(async () => queueMicrotask(() => undefined));

        expect(result.current.isConfirmingDelete).toBe(false);
        expect(result.current.deleteError).toBeUndefined();
    });

    it('focuses the delete trigger after the dialog closes', async () => {
        const { result } = renderHook(() => useExpenseDetailPage());
        const button = document.createElement('button');
        const focus = vi.spyOn(button, 'focus');
        result.current.deleteButtonRef.current = button;

        act(() => result.current.setDeleteDialogOpen(false));
        await act(async () => Promise.resolve());

        expect(focus).toHaveBeenCalledOnce();
    });

    it('deletes the expense and handles a successful mutation', () => {
        let onSuccess: (() => void) | undefined;
        const mutate = vi.fn((_input, options: { onSuccess: () => void }) => {
            onSuccess = options.onSuccess;
        });
        mockDependencies({ deletion: { mutate } });
        const { result } = renderHook(() => useExpenseDetailPage());
        act(() => result.current.openDeleteDialog());

        act(() => result.current.handleDelete());
        expect(toastLoadingMock).toHaveBeenCalledWith('Expense is being deleted…');
        expect(mutate).toHaveBeenCalledWith(
            { id: 'expense-1', groupId: 'group-1' },
            expect.objectContaining({
                onSuccess: expect.any(Function),
                onError: expect.any(Function),
            }),
        );

        act(() => onSuccess?.());
        expect(result.current.isConfirmingDelete).toBe(false);
        expect(toastSuccessMock).toHaveBeenCalledWith('Expense deleted', { id: 'toast-id' });
        expect(navigateMock).toHaveBeenCalledWith('/groups/group-1');
    });

    it('keeps the dialog open and exposes the safe message after a failed deletion', () => {
        let onError: (() => void) | undefined;
        mockDependencies({
            deletion: {
                mutate: vi.fn((_input, options: { onError: () => void }) => {
                    onError = options.onError;
                }),
            },
        });
        const { result } = renderHook(() => useExpenseDetailPage());
        act(() => result.current.openDeleteDialog());
        act(() => result.current.handleDelete());
        act(() => onError?.());

        const message = 'We couldn’t delete this expense. Nothing was changed. Try again.';
        expect(result.current.isConfirmingDelete).toBe(true);
        expect(result.current.deleteError).toBe(message);
        expect(toastErrorMock).toHaveBeenCalledWith(message, { id: 'toast-id' });
        expect(navigateMock).not.toHaveBeenCalled();
    });

    it.each([
        ['missing expense', { expense: { data: undefined } }],
        ['pending mutation', { deletion: { isPending: true } }],
    ])('does not request deletion for a %s', (_label, overrides) => {
        const mutate = vi.fn();
        mockDependencies({ ...overrides, deletion: { mutate, ...overrides.deletion } });
        const { result } = renderHook(() => useExpenseDetailPage());

        act(() => result.current.handleDelete());

        expect(mutate).not.toHaveBeenCalled();
        expect(toastLoadingMock).not.toHaveBeenCalled();
    });
});
