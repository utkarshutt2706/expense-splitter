import { ArrowRightLeft } from 'lucide-react';
import { Link } from 'react-router';

import { useCurrentUser } from '@app/hooks';
import type { Expense, Payment, User } from '@data/entities';
import { useExpenses } from '@features/expenses/hooks/useExpenses';
import { calculateExpenseInvolvement } from '@features/expenses/utils/calculateExpenseInvolvement';
import { usePayments } from '@features/payments';
import { Avatar, FetchingIndicator, Skeleton } from '@shared/components';

interface GroupActivityListProps {
    readonly groupId: string;
    readonly members: User[];
    readonly isMembersLoading?: boolean;
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});

function memberLabel(member: User | undefined, currentUserId: string | undefined): string {
    if (!member) return 'Someone';
    return member.id === currentUserId ? 'You' : member.name;
}

function ActivityRowSkeleton() {
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

function involvementLabel(
    expense: Expense,
    currentUserId: string | undefined,
): { text: string; className: string } {
    const involvement = calculateExpenseInvolvement(expense, currentUserId ?? '');

    if (involvement.type === 'lent') {
        return { text: `You lent ₹${involvement.amount.toFixed(2)}`, className: 'text-owed' };
    }

    if (involvement.type === 'owed') {
        return { text: `You owe ₹${involvement.amount.toFixed(2)}`, className: 'text-owe' };
    }

    return { text: 'You were not involved', className: 'text-muted-foreground' };
}

interface ExpenseRowProps {
    readonly groupId: string;
    readonly expense: Expense;
    readonly membersById: Map<string, User>;
    readonly currentUserId: string | undefined;
}

function ExpenseRow({ groupId, expense, membersById, currentUserId }: ExpenseRowProps) {
    const payer = membersById.get(expense.paidByUserId);
    const involvement = involvementLabel(expense, currentUserId);

    return (
        <Link
            to={`/groups/${groupId}/expenses/${expense.id}`}
            className="border-border hover:bg-muted flex items-center gap-3 rounded-lg border p-3"
        >
            <Avatar name={payer?.name ?? '?'} />
            <div className="flex-1">
                <p className="text-surface-foreground font-medium">{expense.description}</p>
                <p className="text-muted-foreground text-sm">
                    {memberLabel(payer, currentUserId)} paid ·{' '}
                    {dateFormatter.format(new Date(expense.createdAt))}
                </p>
            </div>
            <div className="flex flex-col items-end gap-0.5">
                <p className="text-surface-foreground font-medium">₹{expense.amount.toFixed(2)}</p>
                <p className={`text-xs ${involvement.className}`}>{involvement.text}</p>
            </div>
        </Link>
    );
}

interface PaymentRowProps {
    readonly payment: Payment;
    readonly membersById: Map<string, User>;
    readonly currentUserId: string | undefined;
}

// No detail page exists for a payment (it's a single atomic record, nothing to
// drill into), so this renders as a plain div rather than a Link like ExpenseRow.
function PaymentRow({ payment, membersById, currentUserId }: PaymentRowProps) {
    const from = membersById.get(payment.fromUserId);
    const to = membersById.get(payment.toUserId);

    return (
        <div className="border-border bg-owed/5 flex items-center gap-3 rounded-lg border p-3">
            <span className="bg-owed/10 text-owed flex size-9 shrink-0 items-center justify-center rounded-full">
                <ArrowRightLeft className="size-4" />
            </span>
            <div className="flex-1">
                <p className="text-surface-foreground font-medium">
                    {memberLabel(from, currentUserId)} paid {memberLabel(to, currentUserId)}
                </p>
                <p className="text-muted-foreground text-sm">
                    {dateFormatter.format(new Date(payment.createdAt))}
                </p>
            </div>
            <p className="text-owed font-medium">₹{payment.amount.toFixed(2)}</p>
        </div>
    );
}

type ActivityItem =
    | { type: 'expense'; id: string; createdAt: string; expense: Expense }
    | { type: 'payment'; id: string; createdAt: string; payment: Payment };

export function GroupActivityList({
    groupId,
    members,
    isMembersLoading = false,
}: GroupActivityListProps) {
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
            createdAt: expense.createdAt,
            expense,
        })),
        ...(payments ?? []).map((payment): ActivityItem => ({
            type: 'payment',
            id: payment.id,
            createdAt: payment.createdAt,
            payment,
        })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (items.length === 0) {
        return (
            <div className="text-muted-foreground flex items-center gap-2">
                No activity yet.
                {isRefreshing && <FetchingIndicator />}
            </div>
        );
    }

    const membersById = new Map(members.map((member) => [member.id, member]));

    return (
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
                            currentUserId={currentUser?.id}
                        />
                    ) : (
                        <PaymentRow
                            payment={item.payment}
                            membersById={membersById}
                            currentUserId={currentUser?.id}
                        />
                    )}
                </li>
            ))}
        </ul>
    );
}
