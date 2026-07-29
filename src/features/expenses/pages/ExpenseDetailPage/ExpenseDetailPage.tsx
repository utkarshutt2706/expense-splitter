import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';

import type { User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { useExpense } from '@features/expenses/hooks/useExpense';
import { useGroup, useGroupMembers } from '@features/groups';
import { Avatar, Skeleton, SkeletonList } from '@shared/components';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});

function memberLabel(member: User | undefined): string {
    if (!member) return 'Someone';
    return member.id === CURRENT_USER_ID ? 'You' : member.name;
}

export function ExpenseDetailPage() {
    const { groupId, expenseId } = useParams<{ groupId: string; expenseId: string }>();
    const {
        data: expense,
        isLoading: isExpenseLoading,
        isError: isExpenseError,
    } = useExpense(expenseId ?? '');
    const { data: group } = useGroup(groupId ?? '');
    const { data: members, isLoading: isMembersLoading } = useGroupMembers(group?.memberIds ?? []);

    const isLoading = isExpenseLoading || isMembersLoading;

    let content: ReactNode;
    if (isLoading) {
        content = <SkeletonList label="Loading expense…" />;
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
                        className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border p-2 text-sm font-medium text-surface-foreground hover:bg-muted md:px-3 md:py-1.5"
                    >
                        <Pencil className="size-4" />
                        <span className="hidden md:inline">Edit</span>
                    </button>
                    <button
                        type="button"
                        aria-label="Delete expense"
                        title="Delete expense"
                        className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border p-2 text-sm font-medium text-red-600 hover:bg-muted md:px-3 md:py-1.5"
                    >
                        <Trash2 className="size-4" />
                        <span className="hidden md:inline">Delete</span>
                    </button>
                </div>
            </div>

            {content}
        </div>
    );
}
