import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { useCurrentUser } from '@app/hooks';
import type { Expense } from '@features/expenses/api/expensesApi';
import { useDeleteExpense } from '@features/expenses/hooks/useDeleteExpense';
import { useExpenses } from '@features/expenses/hooks/useExpenses';
import type { Payment } from '@features/payments/api/paymentsApi';
import type { RecordPaymentFormValues } from '@features/payments/components/RecordPaymentForm';
import { useDeletePayment, usePayments, useUpdatePayment } from '@features/payments';
import type { User } from '@features/users/api/usersApi';
import { compareFinancialActivityNewestFirst, participantNameMap } from '@shared/utils';

export type ActivityItem =
    | { type: 'expense'; id: string; paidOn: string; createdAt: string; expense: Expense }
    | { type: 'payment'; id: string; paidOn: string; createdAt: string; payment: Payment };

function activityItems(expenses: Expense[] = [], payments: Payment[] = []): ActivityItem[] {
    return [
        ...expenses.map((expense): ActivityItem => ({
            type: 'expense',
            id: expense.id,
            paidOn: expense.paidOn ?? expense.createdAt,
            createdAt: expense.createdAt,
            expense,
        })),
        ...payments.map((payment): ActivityItem => ({
            type: 'payment',
            id: payment.id,
            paidOn: payment.paidOn ?? payment.createdAt,
            createdAt: payment.createdAt,
            payment,
        })),
    ].sort(compareFinancialActivityNewestFirst);
}

export function useGroupActivityList(groupId: string, members: User[], isMembersLoading: boolean) {
    const navigate = useNavigate();
    const { data: currentUser } = useCurrentUser();
    const expensesQuery = useExpenses(groupId);
    const paymentsQuery = usePayments(groupId);
    const deleteExpense = useDeleteExpense();
    const deletePayment = useDeletePayment();
    const updatePayment = useUpdatePayment();
    const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
    const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);

    function confirmDeleteExpense() {
        if (!deletingExpense) return;
        const expense = deletingExpense;
        setDeletingExpense(null);
        const toastId = toast.loading('Expense is being deleted…');
        deleteExpense.mutate(
            { id: expense.id, groupId },
            {
                onSuccess: () => toast.success('Expense deleted', { id: toastId }),
                onError: (error) => toast.error(error.message, { id: toastId }),
            },
        );
    }

    function updateEditingPayment(values: RecordPaymentFormValues) {
        if (!editingPayment) return;
        const toastId = toast.loading('Payment is being updated…');
        updatePayment.mutate(
            { groupId, id: editingPayment.id, ...values },
            {
                onSuccess: () => toast.success('Payment updated', { id: toastId }),
                onError: (error) => toast.error(error.message, { id: toastId }),
            },
        );
    }

    function confirmDeletePayment() {
        if (!deletingPayment) return;
        const payment = deletingPayment;
        setDeletingPayment(null);
        const toastId = toast.loading('Payment is being deleted…');
        deletePayment.mutate(
            { groupId, id: payment.id },
            {
                onSuccess: () => toast.success('Payment deleted', { id: toastId }),
                onError: (error) => toast.error(error.message, { id: toastId }),
            },
        );
    }

    return {
        currentUserId: currentUser?.id,
        deletingExpense,
        deletingPayment,
        editingPayment,
        isError: expensesQuery.isError || paymentsQuery.isError,
        isLoading: expensesQuery.isLoading || paymentsQuery.isLoading || isMembersLoading,
        isRefreshing: expensesQuery.isFetching || paymentsQuery.isFetching,
        items: activityItems(expensesQuery.data, paymentsQuery.data),
        membersById: new Map(members.map((member) => [member.id, member])),
        names: participantNameMap(members, currentUser?.id),
        closeDeleteExpense: () => setDeletingExpense(null),
        closeDeletePayment: () => setDeletingPayment(null),
        closeEditPayment: () => setEditingPayment(null),
        confirmDeleteExpense,
        confirmDeletePayment,
        editExpense: (expense: Expense) =>
            navigate(`/groups/${groupId}/expenses/${expense.id}/edit`),
        openDeleteExpense: setDeletingExpense,
        openDeletePayment: setDeletingPayment,
        openEditPayment: setEditingPayment,
        updateEditingPayment,
    };
}
