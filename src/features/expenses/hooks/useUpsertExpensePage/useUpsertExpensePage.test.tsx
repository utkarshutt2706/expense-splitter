import { act, renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Expense } from '@features/expenses/api/expensesApi';
import type { UpsertExpenseFormValues } from '@features/expenses/components/UpsertExpenseForm';
import { useCreateExpense } from '@features/expenses/hooks/useCreateExpense';
import { useExpense } from '@features/expenses/hooks/useExpense';
import { useUpdateExpense } from '@features/expenses/hooks/useUpdateExpense';
import type { Group } from '@features/groups/api/groupsApi';
import { useGroup, useGroupMembers } from '@features/groups';
import type { User } from '@features/users/api/usersApi';
import { CURRENT_USER_ID } from '@test/fixtures/ids';
import { useUpsertExpensePage } from './useUpsertExpensePage';

const navigateMock = vi.fn();
let paramsMock: { groupId?: string; expenseId?: string } = { groupId: 'group-1' };

vi.mock('react-router', () => ({
    useNavigate: () => navigateMock,
    useParams: () => paramsMock,
}));

vi.mock('@features/groups', () => ({
    useGroup: vi.fn(),
    useGroupMembers: vi.fn(),
}));

vi.mock('@features/expenses/hooks/useExpense', () => ({ useExpense: vi.fn() }));
vi.mock('@features/expenses/hooks/useCreateExpense', () => ({ useCreateExpense: vi.fn() }));
vi.mock('@features/expenses/hooks/useUpdateExpense', () => ({ useUpdateExpense: vi.fn() }));

vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
        loading: vi.fn(() => 'toast-id'),
        success: vi.fn(),
    },
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

const values: UpsertExpenseFormValues = {
    description: 'Groceries',
    amount: 42.5,
    paidByUserId: CURRENT_USER_ID,
    paidOn: '2026-07-24',
    participantUserIds: [CURRENT_USER_ID, 'friend-1'],
    splitType: 'equal',
};

beforeEach(() => {
    vi.clearAllMocks();
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

describe('useUpsertExpensePage', () => {
    it('provides add-mode state and creates an expense successfully', () => {
        let onSuccess: (() => void) | undefined;
        const mutate = vi.fn((_input, options: { onSuccess?: () => void }) => {
            onSuccess = options.onSuccess;
        });
        vi.mocked(useCreateExpense).mockReturnValue({
            mutate,
        } as unknown as ReturnType<typeof useCreateExpense>);

        const { result } = renderHook(() => useUpsertExpensePage());

        expect(result.current).toMatchObject({
            backTo: '/groups/group-1',
            isEditMode: false,
            isLoading: false,
            initialValues: undefined,
            members,
        });

        act(() => result.current.handleSubmit(values));

        expect(toast.loading).toHaveBeenCalledWith('Expense is being added…');
        expect(mutate).toHaveBeenCalledWith({ groupId: 'group-1', ...values }, expect.anything());

        act(() => onSuccess?.());

        expect(toast.success).toHaveBeenCalledWith('Expense added', { id: 'toast-id' });
        expect(navigateMock).toHaveBeenCalledWith('/groups/group-1');
    });

    it('reports a create failure without navigating', () => {
        let onError: ((error: Error) => void) | undefined;
        const mutate = vi.fn((_input, options: { onError?: (error: Error) => void }) => {
            onError = options.onError;
        });
        vi.mocked(useCreateExpense).mockReturnValue({
            mutate,
        } as unknown as ReturnType<typeof useCreateExpense>);
        const { result } = renderHook(() => useUpsertExpensePage());

        act(() => result.current.handleSubmit(values));
        act(() => onError?.(new Error('Could not add expense')));

        expect(toast.error).toHaveBeenCalledWith('Could not add expense', { id: 'toast-id' });
        expect(navigateMock).not.toHaveBeenCalled();
    });

    it('provides edit-mode state and updates an expense successfully', () => {
        paramsMock = { groupId: 'group-1', expenseId: 'expense-1' };
        vi.mocked(useExpense).mockReturnValue({
            data: expense,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpense>);
        let onSuccess: (() => void) | undefined;
        const mutate = vi.fn((_input, options: { onSuccess?: () => void }) => {
            onSuccess = options.onSuccess;
        });
        vi.mocked(useUpdateExpense).mockReturnValue({
            mutate,
        } as unknown as ReturnType<typeof useUpdateExpense>);

        const { result } = renderHook(() => useUpsertExpensePage());

        expect(result.current).toMatchObject({
            backTo: '/groups/group-1/expenses/expense-1',
            expense,
            initialValues: {
                amount: 90,
                description: 'Chicken',
            },
            isEditMode: true,
            isExpenseError: false,
        });

        act(() => result.current.handleSubmit(values));

        expect(toast.loading).toHaveBeenCalledWith('Expense is being updated…');
        expect(mutate).toHaveBeenCalledWith(
            { id: 'expense-1', groupId: 'group-1', ...values },
            expect.anything(),
        );

        act(() => onSuccess?.());

        expect(toast.success).toHaveBeenCalledWith('Expense updated', { id: 'toast-id' });
        expect(navigateMock).toHaveBeenCalledWith('/groups/group-1/expenses/expense-1');
    });

    it('reports an update failure without navigating', () => {
        paramsMock = { groupId: 'group-1', expenseId: 'expense-1' };
        let onError: ((error: Error) => void) | undefined;
        const mutate = vi.fn((_input, options: { onError?: (error: Error) => void }) => {
            onError = options.onError;
        });
        vi.mocked(useUpdateExpense).mockReturnValue({
            mutate,
        } as unknown as ReturnType<typeof useUpdateExpense>);
        const { result } = renderHook(() => useUpsertExpensePage());

        act(() => result.current.handleSubmit(values));
        act(() => onError?.(new Error('Could not update expense')));

        expect(toast.error).toHaveBeenCalledWith('Could not update expense', { id: 'toast-id' });
        expect(navigateMock).not.toHaveBeenCalled();
    });

    it('combines member and edit-expense loading states', () => {
        vi.mocked(useGroupMembers).mockReturnValue({
            data: undefined,
            isLoading: true,
        } as unknown as ReturnType<typeof useGroupMembers>);
        const { result: addResult } = renderHook(() => useUpsertExpensePage());

        expect(addResult.current.isLoading).toBe(true);
        expect(addResult.current.members).toEqual([]);

        paramsMock = { groupId: 'group-1', expenseId: 'expense-1' };
        vi.mocked(useGroupMembers).mockReturnValue({
            data: members,
            isLoading: false,
        } as unknown as ReturnType<typeof useGroupMembers>);
        vi.mocked(useExpense).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useExpense>);
        const { result: editResult } = renderHook(() => useUpsertExpensePage());

        expect(editResult.current.isLoading).toBe(true);
    });

    it('cancels to the relevant parent route', () => {
        paramsMock = { groupId: 'group-1', expenseId: 'expense-1' };
        const { result } = renderHook(() => useUpsertExpensePage());

        act(() => result.current.cancel());

        expect(navigateMock).toHaveBeenCalledWith('/groups/group-1/expenses/expense-1');
    });

    it('does not mutate when the group route parameter is missing', () => {
        paramsMock = {};
        const createMutate = vi.fn();
        vi.mocked(useCreateExpense).mockReturnValue({
            mutate: createMutate,
        } as unknown as ReturnType<typeof useCreateExpense>);
        const { result } = renderHook(() => useUpsertExpensePage());

        act(() => result.current.handleSubmit(values));

        expect(createMutate).not.toHaveBeenCalled();
        expect(toast.loading).not.toHaveBeenCalled();
    });
});
