import { ArrowRightLeft, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';

import { useCurrentUser } from '@app/hooks';
import type { Expense, Payment, User } from '@data/entities';
import { ActivityRowSkeleton } from '@features/expenses/components/ActivityRowSkeleton';
import { useDeleteExpense } from '@features/expenses/hooks/useDeleteExpense';
import { useExpenses } from '@features/expenses/hooks/useExpenses';
import { calculateExpenseInvolvement } from '@features/expenses/utils/calculateExpenseInvolvement';
import { useDeletePayment, usePayments, useUpdatePayment } from '@features/payments';
import { RecordPaymentDialog } from '@features/payments/components/RecordPaymentDialog';
import type { RecordPaymentFormValues } from '@features/payments/components/RecordPaymentForm';
import { Avatar, ConfirmationDialog, FetchingIndicator, SwipeableRow } from '@shared/components';
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

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});

function memberLabel(member: User | undefined, names: Map<string, string>): string {
    if (!member) return 'Someone';
    return names.get(member.id) ?? member.name;
}

function involvementLabel(
    expense: Expense,
    currentUserId: string | undefined,
): { text: string; className: string } {
    const involvement = calculateExpenseInvolvement(expense, currentUserId ?? '');

    if (involvement.type === 'lent') {
        return { text: `You lent ${formatCurrency(involvement.amount)}`, className: 'text-owed' };
    }

    if (involvement.type === 'owed') {
        return { text: `You owe ${formatCurrency(involvement.amount)}`, className: 'text-owe' };
    }

    return { text: 'You were not involved', className: 'text-muted-foreground' };
}

type ExpenseRowProps = Readonly<{
    groupId: string;
    expense: Expense;
    membersById: Map<string, User>;
    names: Map<string, string>;
    currentUserId: string | undefined;
    onEdit: () => void;
    onDelete: () => void;
}>;

function ExpenseRow({
    groupId,
    expense,
    membersById,
    names,
    currentUserId,
    onEdit,
    onDelete,
}: ExpenseRowProps) {
    const payer = membersById.get(expense.paidByUserId);
    const involvement = involvementLabel(expense, currentUserId);

    return (
        <SwipeableRow
            actions={[
                { key: 'edit', label: 'Edit', icon: Pencil, onClick: onEdit },
                {
                    key: 'delete',
                    label: 'Delete',
                    icon: Trash2,
                    tone: 'destructive',
                    onClick: onDelete,
                },
            ]}
        >
            <Link
                to={`/groups/${groupId}/expenses/${expense.id}`}
                className="border-border hover:bg-muted flex items-center gap-3 rounded-lg border p-3"
            >
                <Avatar name={payer?.name ?? '?'} />
                <div className="min-w-0 flex-1">
                    <p className="text-surface-foreground font-medium">{expense.description}</p>
                    <p className="text-muted-foreground text-sm">
                        {memberLabel(payer, names)} paid ·{' '}
                        {dateFormatter.format(new Date(expense.paidOn ?? expense.createdAt))}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                    <p className="text-surface-foreground font-medium">
                        {formatCurrency(expense.amount)}
                    </p>
                    <p className={`text-xs ${involvement.className}`}>{involvement.text}</p>
                </div>
            </Link>
        </SwipeableRow>
    );
}

type PaymentRowProps = Readonly<{
    payment: Payment;
    membersById: Map<string, User>;
    names: Map<string, string>;
    onEdit: () => void;
    onDelete: () => void;
}>;

// No detail page exists for a payment (it's a single atomic record, nothing to
// drill into), so this renders as a plain div rather than a Link like ExpenseRow.
function PaymentRow({ payment, membersById, names, onEdit, onDelete }: PaymentRowProps) {
    const from = membersById.get(payment.fromUserId);
    const to = membersById.get(payment.toUserId);

    return (
        <SwipeableRow
            actions={[
                {
                    key: 'edit',
                    label: 'Edit',
                    icon: Pencil,
                    onClick: onEdit,
                },
                {
                    key: 'delete',
                    label: 'Delete',
                    icon: Trash2,
                    tone: 'destructive',
                    onClick: onDelete,
                },
            ]}
        >
            <div className="border-border bg-owed/5 flex items-center gap-3 rounded-lg border p-3">
                <span className="bg-owed/10 text-owed flex size-9 shrink-0 items-center justify-center rounded-full">
                    <ArrowRightLeft className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-surface-foreground font-medium">
                        {memberLabel(from, names)} paid {memberLabel(to, names)}
                    </p>
                    <p className="text-muted-foreground text-sm">
                        {dateFormatter.format(new Date(payment.paidOn ?? payment.createdAt))}
                    </p>
                </div>
                <p className="text-owed font-medium">{formatCurrency(payment.amount)}</p>
            </div>
        </SwipeableRow>
    );
}

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
                            <ExpenseRow
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
                            <PaymentRow
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
