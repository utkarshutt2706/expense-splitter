import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { useCurrentUser } from '@app/hooks';
import type { Expense } from '@features/expenses/api/expensesApi';
import type { Payment } from '@features/payments/api/paymentsApi';
import type { User } from '@features/users/api/usersApi';
import { ActivityRowSkeleton } from '@features/expenses/components/ActivityRowSkeleton';
import { ExpenseActivityRow } from '@features/expenses/components/ExpenseActivityRow';
import { PaymentActivityRow } from '@features/expenses/components/PaymentActivityRow';
import { useDeleteExpense } from '@features/expenses/hooks/useDeleteExpense';
import { useExpenses } from '@features/expenses/hooks/useExpenses';
import { useDeletePayment, usePayments, useUpdatePayment } from '@features/payments';
import { RecordPaymentDialog } from '@features/payments/components/RecordPaymentDialog';
import type { RecordPaymentFormValues } from '@features/payments/components/RecordPaymentForm';
import { ConfirmationDialog, FetchingIndicator } from '@shared/components';
import {
    compareFinancialActivityNewestFirst,
    formatCurrency,
    participantNameMap,
} from '@shared/utils';

type GroupActivityListProps = Readonly<{
    groupId: string;
    members: User[];
    isMembersLoading?: boolean;
}>;

type ActivityItem =
    | { type: 'expense'; id: string; paidOn: string; createdAt: string; expense: Expense }
    | { type: 'payment'; id: string; paidOn: string; createdAt: string; payment: Payment };

export function GroupActivityList({
    groupId,
    members,
    isMembersLoading = false,
}: GroupActivityListProps) {
    const navigate = useNavigate();
    const { data: currentUser } = useCurrentUser();
    const {
        data: expenses,
        isLoading: isExpensesLoading,
        isFetching: isExpensesFetching,
        isError: isExpensesError,
    } = useExpenses(groupId);
    const {
        data: payments,
        isLoading: isPaymentsLoading,
        isFetching: isPaymentsFetching,
        isError: isPaymentsError,
    } = usePayments(groupId);
    const deleteExpense = useDeleteExpense();
    const deletePayment = useDeletePayment();
    const updatePayment = useUpdatePayment();
    const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
    const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);

    const handleDeleteExpense = () => {
        if (!deletingExpense) return;

        const toastId = toast.loading('Expense is being deleted…');
        deleteExpense.mutate(
            { id: deletingExpense.id, groupId },
            {
                onSuccess: () => toast.success('Expense deleted', { id: toastId }),
                onError: (error) => toast.error(error.message, { id: toastId }),
            },
        );
    };

    const handleUpdatePayment = ({
        fromUserId,
        toUserId,
        amount,
        paidOn,
    }: RecordPaymentFormValues) => {
        if (!editingPayment) return;

        const toastId = toast.loading('Payment is being updated…');
        updatePayment.mutate(
            { groupId, id: editingPayment.id, fromUserId, toUserId, amount, paidOn },
            {
                onSuccess: () => toast.success('Payment updated', { id: toastId }),
                onError: (error) => toast.error(error.message, { id: toastId }),
            },
        );
    };

    const handleDeletePayment = () => {
        if (!deletingPayment) return;

        const toastId = toast.loading('Payment is being deleted…');
        deletePayment.mutate(
            { groupId, id: deletingPayment.id },
            {
                onSuccess: () => toast.success('Payment deleted', { id: toastId }),
                onError: (error) => toast.error(error.message, { id: toastId }),
            },
        );
    };

    if (isExpensesLoading || isPaymentsLoading || isMembersLoading) {
        return (
            <output aria-label="Loading activity…" className="block">
                <ul className="flex flex-col gap-3">
                    {Array.from({ length: 3 }, (_, index) => (
                        <ActivityRowSkeleton key={index} />
                    ))}
                </ul>
            </output>
        );
    }

    if (isExpensesError || isPaymentsError) {
        return <div className="text-red-600">Couldn't load activity.</div>;
    }

    // isLoading only covers the very first fetch — a mutation invalidating these
    // queries (adding an expense, recording a payment) refetches in the background
    // with isLoading staying false, so without this the list would just silently
    // sit stale for the invalidated refetch's own latency.
    const isRefreshing = isExpensesFetching || isPaymentsFetching;

    const items: ActivityItem[] = [
        ...(expenses ?? []).map((expense): ActivityItem => ({
            type: 'expense',
            id: expense.id,
            paidOn: expense.paidOn ?? expense.createdAt,
            createdAt: expense.createdAt,
            expense,
        })),
        ...(payments ?? []).map((payment): ActivityItem => ({
            type: 'payment',
            id: payment.id,
            paidOn: payment.paidOn ?? payment.createdAt,
            createdAt: payment.createdAt,
            payment,
        })),
    ].sort(compareFinancialActivityNewestFirst);

    if (items.length === 0) {
        return (
            <div className="text-muted-foreground flex items-center gap-2">
                No activity yet.
                {isRefreshing && <FetchingIndicator />}
            </div>
        );
    }

    const membersById = new Map(members.map((member) => [member.id, member]));
    const names = participantNameMap(members, currentUser?.id);

    return (
        <>
            <ul className="flex flex-col gap-3">
                {isRefreshing && (
                    <li className="text-muted-foreground flex items-center gap-2 text-sm">
                        <FetchingIndicator />
                        Updating…
                    </li>
                )}
                {items.map((item) => (
                    <li key={`${item.type}-${item.id}`}>
                        {item.type === 'expense' ? (
                            <ExpenseActivityRow
                                groupId={groupId}
                                expense={item.expense}
                                membersById={membersById}
                                names={names}
                                currentUserId={currentUser?.id}
                                onEdit={() =>
                                    navigate(`/groups/${groupId}/expenses/${item.expense.id}/edit`)
                                }
                                onDelete={() => setDeletingExpense(item.expense)}
                            />
                        ) : (
                            <PaymentActivityRow
                                payment={item.payment}
                                membersById={membersById}
                                names={names}
                                onEdit={() => setEditingPayment(item.payment)}
                                onDelete={() => setDeletingPayment(item.payment)}
                            />
                        )}
                    </li>
                ))}
            </ul>

            <ConfirmationDialog
                open={deletingExpense !== null}
                onOpenChange={(open) => {
                    if (!open) setDeletingExpense(null);
                }}
                title={`Delete "${deletingExpense?.description ?? 'this expense'}"?`}
                description="This will permanently remove the expense from this group."
                confirmLabel="Delete"
                destructive
                onConfirm={() => {
                    setDeletingExpense(null);
                    handleDeleteExpense();
                }}
            />

            <RecordPaymentDialog
                mode="edit"
                open={editingPayment !== null}
                onOpenChange={(open) => {
                    if (!open) setEditingPayment(null);
                }}
                members={members}
                initialValues={
                    editingPayment
                        ? {
                              fromUserId: editingPayment.fromUserId,
                              toUserId: editingPayment.toUserId,
                              amount: editingPayment.amount,
                              paidOn: editingPayment.paidOn ?? editingPayment.createdAt,
                          }
                        : undefined
                }
                onSubmit={handleUpdatePayment}
            />

            <ConfirmationDialog
                open={deletingPayment !== null}
                onOpenChange={(open) => {
                    if (!open) setDeletingPayment(null);
                }}
                title="Delete this payment?"
                description={`This will permanently remove the ${formatCurrency(deletingPayment?.amount)} payment and recalculate group balances.`}
                confirmLabel="Delete"
                destructive
                onConfirm={() => {
                    setDeletingPayment(null);
                    handleDeletePayment();
                }}
            />
        </>
    );
}
