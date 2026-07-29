import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';

import type { Expense, User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { UpsertExpenseDialog } from '@features/expenses/components/UpsertExpenseDialog';
import type {
    UpsertExpenseFormInitialValues,
    UpsertExpenseFormValues,
} from '@features/expenses/components/UpsertExpenseForm';
import { useDeleteExpense } from '@features/expenses/hooks/useDeleteExpense';
import { useExpense } from '@features/expenses/hooks/useExpense';
import { useUpdateExpense } from '@features/expenses/hooks/useUpdateExpense';
import { useGroup, useGroupMembers } from '@features/groups';
import { Avatar, ConfirmationDialog, Skeleton } from '@shared/components';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});

function memberLabel(member: User | undefined): string {
    if (!member) return 'Someone';
    return member.id === CURRENT_USER_ID ? 'You' : member.name;
}

function buildEditInitialValues(expense: Expense): UpsertExpenseFormInitialValues {
    const splitValues: Record<string, string> = {};

    if (expense.splitType === 'exact') {
        for (const split of expense.splits) {
            splitValues[split.userId] = split.amount.toString();
        }
    } else if (expense.splitType === 'percentage') {
        for (const split of expense.splits) {
            splitValues[split.userId] = ((split.amount / expense.amount) * 100).toFixed(2);
        }
    }
    // Shares are left blank: only the resulting dollar amounts are persisted, not the
    // original share counts, and share counts aren't recoverable from amounts alone
    // (e.g. 2:1 and 4:2 produce identical splits) — editing a shares split means
    // re-entering shares.

    return {
        description: expense.description,
        amount: expense.amount,
        paidByUserId: expense.paidByUserId,
        participantUserIds: expense.splits.map((split) => split.userId),
        splitType: expense.splitType,
        splitValues,
    };
}

export function ExpenseDetailPage() {
    const { groupId, expenseId } = useParams<{ groupId: string; expenseId: string }>();
    const navigate = useNavigate();
    const {
        data: expense,
        isLoading: isExpenseLoading,
        isError: isExpenseError,
    } = useExpense(expenseId ?? '');
    const { data: group } = useGroup(groupId ?? '');
    const { data: members, isLoading: isMembersLoading } = useGroupMembers(group?.memberIds ?? []);
    const deleteExpense = useDeleteExpense();
    const updateExpense = useUpdateExpense();
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [isEditingExpense, setIsEditingExpense] = useState(false);

    const isLoading = isExpenseLoading || isMembersLoading;

    const handleDelete = () => {
        if (!expense || !groupId) return;

        const toastId = toast.loading('Expense is being deleted…');
        deleteExpense.mutate(
            { id: expense.id, groupId },
            {
                onSuccess: () => {
                    toast.success('Expense deleted', { id: toastId });
                    navigate(`/groups/${groupId}`);
                },
                onError: (error) => toast.error(error.message, { id: toastId }),
            },
        );
    };

    const handleUpdateExpense = (values: UpsertExpenseFormValues) => {
        if (!expense || !groupId) return;

        const toastId = toast.loading('Expense is being updated…');
        updateExpense.mutate(
            { id: expense.id, groupId, ...values },
            {
                onSuccess: () => toast.success('Expense updated', { id: toastId }),
                onError: (error) => toast.error(error.message, { id: toastId }),
            },
        );
    };

    let content: ReactNode;
    if (isLoading) {
        content = (
            <output aria-label="Loading expense…" className="flex flex-col gap-6">
                <div>
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="mt-2 h-4 w-56" />
                </div>

                <div>
                    <div className="flex items-center gap-3">
                        <Skeleton className="size-9 shrink-0 rounded-full" />
                        <Skeleton className="h-5 w-48" />
                    </div>

                    <ul className="relative mt-3 ml-4.5 flex flex-col gap-4">
                        <span
                            aria-hidden="true"
                            className="absolute top-0 bottom-6 left-0 w-px bg-border"
                        />
                        {[0, 1].map((index) => (
                            <li key={index} className="relative flex items-center gap-2 pl-6">
                                <span
                                    aria-hidden="true"
                                    className={
                                        index === 1
                                            ? 'absolute top-0 left-0 h-1/2 w-5 rounded-bl-md border-l border-b border-border'
                                            : 'absolute top-1/2 left-0 h-px w-5 -translate-y-1/2 bg-border'
                                    }
                                />
                                <Skeleton className="size-6 shrink-0 rounded-full" />
                                <Skeleton className="h-4 w-32" />
                            </li>
                        ))}
                    </ul>
                </div>
            </output>
        );
    } else if (isExpenseError || !expense) {
        content = <div className="text-red-600">Couldn't load this expense.</div>;
    } else {
        const membersById = new Map((members ?? []).map((member) => [member.id, member]));
        const splitsByUserId = new Map(expense.splits.map((split) => [split.userId, split.amount]));
        const payer = membersById.get(expense.paidByUserId);
        const participants = (members ?? []).filter((member) => splitsByUserId.has(member.id));
        const addedBy = membersById.get(CURRENT_USER_ID);
        const createdDate = dateFormatter.format(new Date(expense.createdAt));
        // No dedicated payment-date field yet — createdAt stands in until the
        // add-expense form gains one.
        const paidDate = createdDate;

        content = (
            <div className="flex flex-col gap-6">
                <div>
                    <p className="text-2xl font-semibold text-surface-foreground">
                        ₹{expense.amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {`Added by ${memberLabel(addedBy).toLocaleLowerCase()} on ${createdDate}`}
                    </p>
                </div>

                <div>
                    <div className="flex items-center gap-3">
                        <Avatar name={payer?.name ?? '?'} />
                        <p className="font-medium text-surface-foreground">
                            {`${memberLabel(payer)} paid ₹${expense.amount.toFixed(2)} `}
                            <span className="text-muted-foreground">{`on ${paidDate}`}</span>
                        </p>
                    </div>

                    <ul className="relative mt-3 ml-4.5 flex flex-col gap-4">
                        <span
                            aria-hidden="true"
                            className="absolute top-0 bottom-6 left-0 w-px bg-border"
                        />
                        {participants.map((member, index) => {
                            const share = splitsByUserId.get(member.id)!;
                            const isCurrentUser = member.id === CURRENT_USER_ID;
                            const isLast = index === participants.length - 1;

                            return (
                                <li
                                    key={member.id}
                                    className="relative flex items-center gap-2 pl-6"
                                >
                                    {isLast ? (
                                        <span
                                            aria-hidden="true"
                                            className="absolute top-0 left-0 h-1/2 w-5 rounded-bl-md border-l border-b border-border"
                                        />
                                    ) : (
                                        <span
                                            aria-hidden="true"
                                            className="absolute top-1/2 left-0 h-px w-5 -translate-y-1/2 bg-border"
                                        />
                                    )}
                                    <Avatar name={member.name} size="sm" />
                                    <span className="text-sm text-surface-foreground">
                                        {`${memberLabel(member)} owe${isCurrentUser ? '' : 's'} ₹${share.toFixed(2)}`}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Link
                to={`/groups/${groupId}`}
                className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-surface-foreground"
            >
                <ArrowLeft className="size-4" />
                Back to group
            </Link>

            <div className="mb-4 flex items-center gap-3">
                <h1 className="font-display text-xl font-medium text-surface-foreground">
                    {isLoading ? (
                        <Skeleton className="h-7 w-40" />
                    ) : (
                        (expense?.description ?? 'Expense')
                    )}
                </h1>

                <div className="ml-auto flex items-center gap-2">
                    <button
                        type="button"
                        aria-label="Edit expense"
                        title="Edit expense"
                        disabled={isLoading}
                        onClick={() => setIsEditingExpense(true)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border p-2 text-sm font-medium text-surface-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 md:px-3 md:py-1.5"
                    >
                        <Pencil className="size-4" />
                        <span className="hidden md:inline">Edit</span>
                    </button>
                    <button
                        type="button"
                        aria-label="Delete expense"
                        title="Delete expense"
                        disabled={isLoading}
                        onClick={() => setIsConfirmingDelete(true)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border p-2 text-sm font-medium text-red-600 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 md:px-3 md:py-1.5"
                    >
                        <Trash2 className="size-4" />
                        <span className="hidden md:inline">Delete</span>
                    </button>
                </div>
            </div>

            {content}

            <ConfirmationDialog
                open={isConfirmingDelete}
                onOpenChange={setIsConfirmingDelete}
                title={`Delete "${expense?.description ?? 'this expense'}"?`}
                description="This will permanently remove the expense from this group."
                confirmLabel="Delete"
                destructive
                onConfirm={() => {
                    setIsConfirmingDelete(false);
                    handleDelete();
                }}
            />

            <UpsertExpenseDialog
                mode="edit"
                open={isEditingExpense}
                onOpenChange={setIsEditingExpense}
                members={members ?? []}
                initialValues={expense ? buildEditInitialValues(expense) : undefined}
                onSubmit={handleUpdateExpense}
            />
        </div>
    );
}
