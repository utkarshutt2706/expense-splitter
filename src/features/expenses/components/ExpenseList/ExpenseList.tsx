import { Link } from 'react-router';

import type { Expense, User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { useExpenses } from '@features/expenses/hooks/useExpenses';
import { calculateExpenseInvolvement } from '@features/expenses/utils/calculateExpenseInvolvement';
import { Avatar, Skeleton } from '@shared/components';

interface ExpenseListProps {
    readonly groupId: string;
    readonly members: User[];
    readonly isMembersLoading?: boolean;
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});

function payerLabel(payer: User | undefined): string {
    if (!payer) return 'Someone';
    return payer.id === CURRENT_USER_ID ? 'You' : payer.name;
}

function ExpenseRowSkeleton() {
    return (
        <li className="border-border flex items-center gap-3 rounded-lg border p-3">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="flex flex-col items-end gap-1.5">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-3 w-24" />
            </div>
        </li>
    );
}

function involvementLabel(expense: Expense): { text: string; className: string } {
    const involvement = calculateExpenseInvolvement(expense, CURRENT_USER_ID);

    if (involvement.type === 'lent') {
        return { text: `You lent ₹${involvement.amount.toFixed(2)}`, className: 'text-owed' };
    }

    if (involvement.type === 'owed') {
        return { text: `You owe ₹${involvement.amount.toFixed(2)}`, className: 'text-owe' };
    }

    return { text: 'You were not involved', className: 'text-muted-foreground' };
}

export function ExpenseList({ groupId, members, isMembersLoading = false }: ExpenseListProps) {
    const { data: expenses, isLoading, isError } = useExpenses(groupId);

    if (isLoading || isMembersLoading) {
        return (
            <output aria-label="Loading expenses…" className="block">
                <ul className="flex flex-col gap-3">
                    {Array.from({ length: 3 }, (_, index) => (
                        <ExpenseRowSkeleton key={index} />
                    ))}
                </ul>
            </output>
        );
    }

    if (isError) {
        return <div className="text-red-600">Couldn't load expenses.</div>;
    }

    if (!expenses || expenses.length === 0) {
        return <div className="text-muted-foreground">No expenses yet.</div>;
    }

    const membersById = new Map(members.map((member) => [member.id, member]));

    return (
        <ul className="flex flex-col gap-3">
            {expenses.map((expense) => {
                const payer = membersById.get(expense.paidByUserId);
                const involvement = involvementLabel(expense);

                return (
                    <li key={expense.id}>
                        <Link
                            to={`/groups/${groupId}/expenses/${expense.id}`}
                            className="border-border hover:bg-muted flex items-center gap-3 rounded-lg border p-3"
                        >
                            <Avatar name={payer?.name ?? '?'} />
                            <div className="flex-1">
                                <p className="text-surface-foreground font-medium">
                                    {expense.description}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                    {payerLabel(payer)} paid ·{' '}
                                    {dateFormatter.format(new Date(expense.createdAt))}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-0.5">
                                <p className="text-surface-foreground font-medium">
                                    ₹{expense.amount.toFixed(2)}
                                </p>
                                <p className={`text-xs ${involvement.className}`}>
                                    {involvement.text}
                                </p>
                            </div>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}
