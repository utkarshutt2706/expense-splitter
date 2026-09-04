import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Expense } from '@features/expenses/api/expensesApi';
import { useDeleteExpense } from '@features/expenses/hooks/useDeleteExpense';
import { useExpenses } from '@features/expenses/hooks/useExpenses';
import type { Payment } from '@features/payments/api/paymentsApi';
import { useDeletePayment, usePayments, useUpdatePayment } from '@features/payments';
import type { User } from '@features/users/api/usersApi';

import { useGroupActivityList } from './useGroupActivityList';

const { navigateMock, toastLoadingMock, toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
    navigateMock: vi.fn(),
    toastLoadingMock: vi.fn(() => 'toast-id'),
    toastSuccessMock: vi.fn(),
    toastErrorMock: vi.fn(),
}));

vi.mock('react-router', () => ({ useNavigate: () => navigateMock }));
vi.mock('@app/hooks', () => ({
    useCurrentUser: () => ({ data: { id: 'current', name: 'Current User' } }),
}));
vi.mock('@features/expenses/hooks/useExpenses', () => ({ useExpenses: vi.fn() }));
vi.mock('@features/expenses/hooks/useDeleteExpense', () => ({ useDeleteExpense: vi.fn() }));
vi.mock('@features/payments', () => ({
    usePayments: vi.fn(),
    useDeletePayment: vi.fn(),
    useUpdatePayment: vi.fn(),
}));
vi.mock('sonner', () => ({
    toast: { loading: toastLoadingMock, success: toastSuccessMock, error: toastErrorMock },
}));

const expense = {
    id: 'expense-1',
    paidOn: '2026-08-10T00:00:00.000Z',
    createdAt: '2026-08-11T00:00:00.000Z',
} as Expense;
const payment = {
    id: 'payment-1',
    paidOn: '2026-08-12T00:00:00.000Z',
    createdAt: '2026-08-09T00:00:00.000Z',
    fromUserId: 'current',
    toUserId: 'friend',
    amount: 25,
} as Payment;
const members: User[] = [
    { id: 'current', name: 'Current User' },
    { id: 'friend', name: 'Friend User' },
];

const deleteExpenseMutate = vi.fn();
const deletePaymentMutate = vi.fn();
const updatePaymentMutate = vi.fn();

function mockQueries(
    expenses: Record<string, unknown> = {},
    payments: Record<string, unknown> = {},
) {
    vi.mocked(useExpenses).mockReturnValue({
        data: [expense],
        isLoading: false,
        isFetching: false,
        isError: false,
        ...expenses,
    } as unknown as ReturnType<typeof useExpenses>);
    vi.mocked(usePayments).mockReturnValue({
        data: [payment],
        isLoading: false,
        isFetching: false,
        isError: false,
        ...payments,
    } as unknown as ReturnType<typeof usePayments>);
}

describe('useGroupActivityList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockQueries();
        vi.mocked(useDeleteExpense).mockReturnValue({
            mutate: deleteExpenseMutate,
        } as unknown as ReturnType<typeof useDeleteExpense>);
        vi.mocked(useDeletePayment).mockReturnValue({
            mutate: deletePaymentMutate,
        } as unknown as ReturnType<typeof useDeletePayment>);
        vi.mocked(useUpdatePayment).mockReturnValue({
            mutate: updatePaymentMutate,
        } as unknown as ReturnType<typeof useUpdatePayment>);
    });

    it('combines expenses and payments in newest financial-activity order', () => {
        const olderPayment = {
            ...payment,
            id: 'payment-older',
            paidOn: undefined,
            createdAt: '2026-08-01T00:00:00.000Z',
        } as Payment;
        mockQueries({}, { data: [olderPayment, payment] });

        const { result } = renderHook(() => useGroupActivityList('group-1', members, false));

        expect(result.current.items.map(({ type, id }) => `${type}:${id}`)).toEqual([
            'payment:payment-1',
            'expense:expense-1',
            'payment:payment-older',
        ]);
    });

    it('combines query and member loading, error, and refresh states', () => {
        mockQueries(
            { isLoading: false, isFetching: true, isError: true },
            { isLoading: true, isFetching: false, isError: false },
        );
        const { result } = renderHook(() => useGroupActivityList('group-1', members, true));

        expect(result.current).toMatchObject({
            currentUserId: 'current',
            isLoading: true,
            isError: true,
            isRefreshing: true,
        });
        expect(result.current.membersById.get('friend')).toEqual(members[1]);
        expect(result.current.names.get('current')).toBe('You');
        expect(result.current.names.get('friend')).toBe('Friend');
    });

    it('opens and closes each action state and navigates to expense editing', () => {
        const { result } = renderHook(() => useGroupActivityList('group-1', members, false));

        act(() => result.current.openDeleteExpense(expense));
        expect(result.current.deletingExpense).toBe(expense);
        act(() => result.current.closeDeleteExpense());
        expect(result.current.deletingExpense).toBeNull();

        act(() => result.current.openEditPayment(payment));
        expect(result.current.editingPayment).toBe(payment);
        act(() => result.current.closeEditPayment());
        expect(result.current.editingPayment).toBeNull();

        act(() => result.current.openDeletePayment(payment));
        expect(result.current.deletingPayment).toBe(payment);
        act(() => result.current.closeDeletePayment());
        expect(result.current.deletingPayment).toBeNull();

        act(() => result.current.editExpense(expense));
        expect(navigateMock).toHaveBeenCalledWith('/groups/group-1/expenses/expense-1/edit');
    });

    it('confirms expense deletion and reports mutation outcomes', () => {
        let callbacks!: { onSuccess: () => void; onError: (error: Error) => void };
        deleteExpenseMutate.mockImplementation((_input, options) => (callbacks = options));
        const { result } = renderHook(() => useGroupActivityList('group-1', members, false));
        act(() => result.current.openDeleteExpense(expense));

        act(() => result.current.confirmDeleteExpense());

        expect(result.current.deletingExpense).toBeNull();
        expect(toastLoadingMock).toHaveBeenCalledWith('Expense is being deleted…');
        expect(deleteExpenseMutate).toHaveBeenCalledWith(
            { id: 'expense-1', groupId: 'group-1' },
            expect.anything(),
        );
        callbacks.onSuccess();
        callbacks.onError(new Error('Delete failed'));
        expect(toastSuccessMock).toHaveBeenCalledWith('Expense deleted', { id: 'toast-id' });
        expect(toastErrorMock).toHaveBeenCalledWith('Delete failed', { id: 'toast-id' });
    });

    it('updates the selected payment and reports mutation outcomes', () => {
        let callbacks!: { onSuccess: () => void; onError: (error: Error) => void };
        updatePaymentMutate.mockImplementation((_input, options) => (callbacks = options));
        const values = {
            fromUserId: 'friend',
            toUserId: 'current',
            amount: 40,
            paidOn: '2026-08-14',
        };
        const { result } = renderHook(() => useGroupActivityList('group-1', members, false));
        act(() => result.current.openEditPayment(payment));

        act(() => result.current.updateEditingPayment(values));

        expect(updatePaymentMutate).toHaveBeenCalledWith(
            { groupId: 'group-1', id: 'payment-1', ...values },
            expect.anything(),
        );
        callbacks.onSuccess();
        callbacks.onError(new Error('Update failed'));
        expect(toastSuccessMock).toHaveBeenCalledWith('Payment updated', { id: 'toast-id' });
        expect(toastErrorMock).toHaveBeenCalledWith('Update failed', { id: 'toast-id' });
    });

    it('confirms payment deletion and reports mutation outcomes', () => {
        let callbacks!: { onSuccess: () => void; onError: (error: Error) => void };
        deletePaymentMutate.mockImplementation((_input, options) => (callbacks = options));
        const { result } = renderHook(() => useGroupActivityList('group-1', members, false));
        act(() => result.current.openDeletePayment(payment));

        act(() => result.current.confirmDeletePayment());

        expect(result.current.deletingPayment).toBeNull();
        expect(deletePaymentMutate).toHaveBeenCalledWith(
            { groupId: 'group-1', id: 'payment-1' },
            expect.anything(),
        );
        callbacks.onSuccess();
        callbacks.onError(new Error('Delete failed'));
        expect(toastSuccessMock).toHaveBeenCalledWith('Payment deleted', { id: 'toast-id' });
        expect(toastErrorMock).toHaveBeenCalledWith('Delete failed', { id: 'toast-id' });
    });

    it('does not mutate when no action item is selected', () => {
        const { result } = renderHook(() => useGroupActivityList('group-1', members, false));

        act(() => {
            result.current.confirmDeleteExpense();
            result.current.confirmDeletePayment();
            result.current.updateEditingPayment({
                fromUserId: 'current',
                toUserId: 'friend',
                amount: 10,
                paidOn: '2026-08-14',
            });
        });

        expect(deleteExpenseMutate).not.toHaveBeenCalled();
        expect(deletePaymentMutate).not.toHaveBeenCalled();
        expect(updatePaymentMutate).not.toHaveBeenCalled();
    });
});
