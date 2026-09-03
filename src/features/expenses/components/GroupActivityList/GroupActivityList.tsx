import type { User } from '@features/users/api/usersApi';
import { ActivityRowSkeleton } from '@features/expenses/components/ActivityRowSkeleton';
import { ExpenseActivityRow } from '@features/expenses/components/ExpenseActivityRow';
import { PaymentActivityRow } from '@features/expenses/components/PaymentActivityRow';
import { useGroupActivityList } from '@features/expenses/hooks/useGroupActivityList';
import { RecordPaymentDialog } from '@features/payments/components/RecordPaymentDialog';
import { ConfirmationDialog, FetchingIndicator } from '@shared/components';
import { formatCurrency } from '@shared/utils';

type GroupActivityListProps = Readonly<{
    groupId: string;
    members: User[];
    isMembersLoading?: boolean;
}>;

export function GroupActivityList({
    groupId,
    members,
    isMembersLoading = false,
}: GroupActivityListProps) {
    const {
        closeDeleteExpense,
        closeDeletePayment,
        closeEditPayment,
        confirmDeleteExpense,
        confirmDeletePayment,
        currentUserId,
        deletingExpense,
        deletingPayment,
        editExpense,
        editingPayment,
        isError,
        isLoading,
        isRefreshing,
        items,
        membersById,
        names,
        openDeleteExpense,
        openDeletePayment,
        openEditPayment,
        updateEditingPayment,
    } = useGroupActivityList(groupId, members, isMembersLoading);

    if (isLoading) {
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

    if (isError) {
        return <div className="text-red-600">Couldn't load activity.</div>;
    }

    if (items.length === 0) {
        return (
            <div className="text-muted-foreground flex items-center gap-2">
                No activity yet.
                {isRefreshing && <FetchingIndicator />}
            </div>
        );
    }

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
                                currentUserId={currentUserId}
                                onEdit={() => editExpense(item.expense)}
                                onDelete={() => openDeleteExpense(item.expense)}
                            />
                        ) : (
                            <PaymentActivityRow
                                payment={item.payment}
                                membersById={membersById}
                                names={names}
                                onEdit={() => openEditPayment(item.payment)}
                                onDelete={() => openDeletePayment(item.payment)}
                            />
                        )}
                    </li>
                ))}
            </ul>

            <ConfirmationDialog
                open={deletingExpense !== null}
                onOpenChange={(open) => {
                    if (!open) closeDeleteExpense();
                }}
                title={`Delete "${deletingExpense?.description ?? 'this expense'}"?`}
                description="This will permanently remove the expense from this group."
                confirmLabel="Delete"
                destructive
                onConfirm={confirmDeleteExpense}
            />

            <RecordPaymentDialog
                mode="edit"
                open={editingPayment !== null}
                onOpenChange={(open) => {
                    if (!open) closeEditPayment();
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
                onSubmit={updateEditingPayment}
            />

            <ConfirmationDialog
                open={deletingPayment !== null}
                onOpenChange={(open) => {
                    if (!open) closeDeletePayment();
                }}
                title="Delete this payment?"
                description={`This will permanently remove the ${formatCurrency(deletingPayment?.amount)} payment and recalculate group balances.`}
                confirmLabel="Delete"
                destructive
                onConfirm={confirmDeletePayment}
            />
        </>
    );
}
