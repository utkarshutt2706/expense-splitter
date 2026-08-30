import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';

import { useCurrentUser } from '@app/hooks';
import type { User } from '@features/users/api/usersApi';
import { ExpenseDetailSkeleton } from '@features/expenses/components/ExpenseDetailSkeleton';
import { useDeleteExpense } from '@features/expenses/hooks/useDeleteExpense';
import { useExpense } from '@features/expenses/hooks/useExpense';
import { useGroup, useGroupMembers } from '@features/groups';
import { Avatar, ConfirmationDialog, FetchingIndicator, Skeleton } from '@shared/components';
import { formatCurrency, participantNameMap, sortMembersByName } from '@shared/utils';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});
const DELETE_ERROR_MESSAGE = 'We couldn’t delete this expense. Nothing was changed. Try again.';

function memberLabel(member: User | undefined, names: Map<string, string>): string {
    if (!member) return 'Someone';
    return names.get(member.id) ?? member.name;
}

function shareLabel(label: string): string {
    if (label === 'You') return 'Your share';
    return /s$/i.test(label.replace(/ \(You\)$/, '').trim())
        ? `Share for ${label}`
        : `${label}’s share`;
}

function toCents(amount: number): number {
    return Math.round(amount * 100);
}

export function ExpenseDetailPage() {
    const { groupId, expenseId } = useParams<{ groupId: string; expenseId: string }>();
    const navigate = useNavigate();
    const { data: currentUser } = useCurrentUser();
    const {
        data: expense,
        isLoading: isExpenseLoading,
        isFetching: isExpenseFetching,
        isError: isExpenseError,
    } = useExpense(groupId ?? '', expenseId ?? '');
    const { data: group } = useGroup(groupId ?? '');
    const { data: members, isLoading: isMembersLoading } = useGroupMembers(group?.memberIds ?? []);
    const deleteExpense = useDeleteExpense();
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [deleteError, setDeleteError] = useState<string>();
    const deleteButtonRef = useRef<HTMLButtonElement>(null);

    const isLoading = isExpenseLoading || isMembersLoading;
    // isLoading only covers the very first fetch — editing this expense refetches
    // it in the background with isLoading staying false, so without this the page
    // would just silently sit stale for the invalidated refetch's own latency.
    const isRefreshing = !isLoading && isExpenseFetching;

    const handleDelete = () => {
        if (!expense || !groupId || deleteExpense.isPending) return;

        setDeleteError(undefined);
        const toastId = toast.loading('Expense is being deleted…');
        deleteExpense.mutate(
            { id: expense.id, groupId },
            {
                onSuccess: () => {
                    setIsConfirmingDelete(false);
                    toast.success('Expense deleted', { id: toastId });
                    navigate(`/groups/${groupId}`);
                },
                onError: () => {
                    setDeleteError(DELETE_ERROR_MESSAGE);
                    toast.error(DELETE_ERROR_MESSAGE, { id: toastId });
                },
            },
        );
    };

    let content: ReactNode;
    if (isLoading) {
        content = (
            <output aria-label="Loading expense…" className="flex flex-col gap-6">
                <ExpenseDetailSkeleton />
            </output>
        );
    } else if (isExpenseError || !expense) {
        content = <div className="text-red-600">Couldn't load this expense.</div>;
    } else {
        const membersById = new Map((members ?? []).map((member) => [member.id, member]));
        const names = participantNameMap(members ?? [], currentUser?.id);
        const splitsByUserId = new Map(expense.splits.map((split) => [split.userId, split.amount]));
        const payer = membersById.get(expense.paidByUserId);
        const participants = sortMembersByName(
            (members ?? []).filter((member) => splitsByUserId.has(member.id)),
            { isCurrentUser: (member) => member.id === currentUser?.id },
        );
        const addedBy = membersById.get(expense.createdByUserId ?? expense.paidByUserId);
        const createdDate = dateFormatter.format(new Date(expense.createdAt));
        const paidDate = dateFormatter.format(new Date(expense.paidOn ?? expense.createdAt));
        const payerSplit = expense.splits.find((split) => split.userId === expense.paidByUserId);
        const coveredForOthersCents =
            payerSplit && Number.isFinite(payerSplit.amount) && Number.isFinite(expense.amount)
                ? toCents(expense.amount) - toCents(payerSplit.amount)
                : 0;

        content = (
            <div className="flex flex-col gap-6">
                <div>
                    <p className="text-surface-foreground text-2xl font-semibold">
                        {formatCurrency(expense.amount)}
                    </p>
                    <p className="text-muted-foreground text-sm">
                        {`Added by ${memberLabel(addedBy, names)} on ${createdDate}`}
                    </p>
                </div>

                <div>
                    <div className="flex items-center gap-3">
                        <Avatar name={payer?.name ?? '?'} />
                        <p className="text-surface-foreground font-medium">
                            {`${memberLabel(payer, names)} paid ${formatCurrency(expense.amount)} `}
                            <span className="text-muted-foreground">{`on ${paidDate}`}</span>
                        </p>
                    </div>
                    {coveredForOthersCents > 0 && (
                        <p className="text-muted-foreground mt-2 ml-11 text-sm">
                            {`${memberLabel(payer, names)} covered ${formatCurrency(coveredForOthersCents / 100)} for others.`}
                        </p>
                    )}

                    <ul className="relative mt-3 ml-4.5 flex flex-col gap-4">
                        <span
                            aria-hidden="true"
                            className="bg-border absolute top-0 bottom-6 left-0 w-px"
                        />
                        {participants.map((member, index) => {
                            const share = splitsByUserId.get(member.id)!;
                            const isLast = index === participants.length - 1;

                            return (
                                <li
                                    key={member.id}
                                    className="relative flex items-center gap-2 pl-6"
                                >
                                    {isLast ? (
                                        <span
                                            aria-hidden="true"
                                            className="border-border absolute top-0 left-0 h-1/2 w-5 rounded-bl-md border-b border-l"
                                        />
                                    ) : (
                                        <span
                                            aria-hidden="true"
                                            className="bg-border absolute top-1/2 left-0 h-px w-5 -translate-y-1/2"
                                        />
                                    )}
                                    <Avatar name={member.name} size="sm" />
                                    <span className="text-surface-foreground text-sm">
                                        {`${shareLabel(names.get(member.id) ?? member.name)} ${formatCurrency(share)}`}
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
                        onClick={() => {
                            setDeleteError(undefined);
                            setIsConfirmingDelete(true);
                        }}
                        className="border-border hover:bg-muted inline-flex cursor-pointer items-center gap-1 rounded-md border p-2 text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-60 md:px-3 md:py-1.5"
                    >
                        <Trash2 className="size-4" />
                        <span className="hidden md:inline">Delete</span>
                    </button>
                </div>
            </div>

            {content}

            <ConfirmationDialog
                open={isConfirmingDelete}
                onOpenChange={(open) => {
                    setIsConfirmingDelete(open);
                    if (!open) {
                        setDeleteError(undefined);
                        queueMicrotask(() => deleteButtonRef.current?.focus());
                    }
                }}
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
                isPending={deleteExpense.isPending}
                errorMessage={deleteError}
                onConfirm={handleDelete}
            />
        </div>
    );
}
