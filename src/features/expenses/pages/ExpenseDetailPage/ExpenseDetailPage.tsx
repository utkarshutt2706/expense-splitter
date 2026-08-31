import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router';

import { ExpenseDetailContent } from '@features/expenses/components/ExpenseDetailContent';
import { ExpenseDetailSkeleton } from '@features/expenses/components/ExpenseDetailSkeleton';
import { useExpenseDetailPage } from '@features/expenses/hooks/useExpenseDetailPage';
import { ConfirmationDialog, FetchingIndicator, Skeleton } from '@shared/components';
import { formatCurrency } from '@shared/utils';

export function ExpenseDetailPage() {
    const {
        currentUserId,
        deleteButtonRef,
        deleteError,
        expense,
        expenseId,
        group,
        groupId,
        handleDelete,
        isConfirmingDelete,
        isDeletePending,
        isExpenseError,
        isLoading,
        isRefreshing,
        members,
        openDeleteDialog,
        setDeleteDialogOpen,
    } = useExpenseDetailPage();

    return (
        <div>
            <Link
                to={`/groups/${groupId}`}
                className="text-muted-foreground hover:text-surface-foreground mb-4 inline-flex items-center gap-1 text-sm"
            >
                <ArrowLeft className="size-4" />
                Back to group
            </Link>

            <div className="mb-4 flex items-center gap-3">
                <h1 className="text-surface-foreground text-xl font-medium">
                    {isLoading ? (
                        <Skeleton className="h-7 w-40" />
                    ) : (
                        (expense?.description ?? 'Expense')
                    )}
                </h1>
                {isRefreshing && <FetchingIndicator />}
                <div className="ml-auto flex items-center gap-2">
                    {isLoading ? (
                        <button
                            type="button"
                            aria-label="Edit expense"
                            title="Edit expense"
                            disabled
                            className="border-border text-surface-foreground inline-flex cursor-not-allowed items-center gap-1 rounded-md border p-2 text-sm font-medium opacity-60 md:px-3 md:py-1.5"
                        >
                            <Pencil className="size-4" />
                            <span className="hidden md:inline">Edit</span>
                        </button>
                    ) : (
                        <Link
                            to={`/groups/${groupId}/expenses/${expenseId}/edit`}
                            aria-label="Edit expense"
                            title="Edit expense"
                            className="border-border text-surface-foreground hover:bg-muted inline-flex items-center gap-1 rounded-md border p-2 text-sm font-medium md:px-3 md:py-1.5"
                        >
                            <Pencil className="size-4" />
                            <span className="hidden md:inline">Edit</span>
                        </Link>
                    )}
                    <button
                        ref={deleteButtonRef}
                        type="button"
                        aria-label="Delete expense"
                        title="Delete expense"
                        disabled={isLoading}
                        onClick={openDeleteDialog}
                        className="border-border hover:bg-muted inline-flex cursor-pointer items-center gap-1 rounded-md border p-2 text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-60 md:px-3 md:py-1.5"
                    >
                        <Trash2 className="size-4" />
                        <span className="hidden md:inline">Delete</span>
                    </button>
                </div>
            </div>

            {isLoading ? (
                <output aria-label="Loading expense…" className="flex flex-col gap-6">
                    <ExpenseDetailSkeleton />
                </output>
            ) : isExpenseError || !expense ? (
                <div className="text-red-600">Couldn't load this expense.</div>
            ) : (
                <ExpenseDetailContent
                    expense={expense}
                    members={members}
                    currentUserId={currentUserId}
                />
            )}

            <ConfirmationDialog
                open={isConfirmingDelete}
                onOpenChange={setDeleteDialogOpen}
                title="Delete expense?"
                description={
                    <span className="flex flex-col gap-3">
                        <span>
                            You’re about to permanently delete “
                            {expense?.description ?? 'this expense'}” for{' '}
                            {expense ? formatCurrency(expense.amount) : 'this amount'}
                            {group?.name ? ` from ${group.name}` : ''}.
                        </span>
                        <span>
                            This will remove everyone’s shares for this expense and recalculate the
                            group’s balances. This action cannot be undone.
                        </span>
                    </span>
                }
                confirmLabel="Delete expense"
                pendingLabel="Deleting…"
                destructive
                isPending={isDeletePending}
                errorMessage={deleteError}
                onConfirm={handleDelete}
            />
        </div>
    );
}
