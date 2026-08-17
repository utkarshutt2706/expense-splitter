import { ArrowRight } from 'lucide-react';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router';

import { useCurrentUser } from '@app/hooks';
import type { User } from '@data/entities';
import { useGroupBalances } from '@features/balances/hooks/useGroupBalances';
import { FetchingIndicator, Skeleton } from '@shared/components';
import { formatCurrency } from '@shared/utils';

interface GroupBalanceSummaryProps {
    readonly groupId: string;
    readonly members: User[];
}

type Celebration = 'personal' | 'group';

const CONFETTI_COLORS = ['#c2410c', '#ea580c', '#f97316', '#f59e0b', '#d6a15d'];

function shouldCelebrate(groupId: string, celebration: Celebration): boolean {
    if (
        typeof window === 'undefined' ||
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
        return false;
    }

    const key = `expense-splitter:settlement-celebrated:${groupId}:${celebration}`;
    try {
        if (window.sessionStorage.getItem(key)) return false;
        window.sessionStorage.setItem(key, 'true');
        return true;
    } catch {
        return true;
    }
}

function SettlementConfetti({
    groupId,
    celebration,
}: {
    groupId: string;
    celebration: Celebration;
}) {
    const [visible, setVisible] = useState(() => shouldCelebrate(groupId, celebration));
    if (!visible) return null;

    const particleCount = celebration === 'group' ? 18 : 12;
    return (
        <span
            aria-hidden="true"
            data-testid={`${celebration}-settlement-confetti`}
            onAnimationEnd={() => setVisible(false)}
            className="settlement-confetti pointer-events-none fixed inset-0 z-40 overflow-hidden"
        >
            {Array.from({ length: particleCount }, (_, index) => (
                <span
                    key={index}
                    className="settlement-confetti__particle"
                    style={
                        {
                            '--confetti-color': CONFETTI_COLORS[index % CONFETTI_COLORS.length],
                            '--confetti-delay': `${(index % 6) * 70}ms`,
                            '--confetti-left': `${8 + ((index * 47) % 84)}%`,
                            '--confetti-rotation': `${90 + ((index * 53) % 240)}deg`,
                        } as CSSProperties
                    }
                />
            ))}
        </span>
    );
}

export function GroupBalanceSummary({ groupId, members }: GroupBalanceSummaryProps) {
    const { data: currentUser } = useCurrentUser();
    const {
        data: groupBalances,
        isLoading: isBalancesLoading,
        isFetching: isBalancesFetching,
        isError: isBalancesError,
        refetch,
    } = useGroupBalances(groupId);

    if (isBalancesLoading) {
        return (
            <div
                aria-label="Loading balance summary…"
                className="border-border rounded-xl border p-4"
            >
                <Skeleton className="h-6 w-48 max-w-full" />
                <Skeleton className="mt-2 h-4 w-28" />
            </div>
        );
    }

    if (isBalancesError) {
        return (
            <div className="border-border rounded-xl border p-4" role="alert">
                <p className="font-medium">Balance unavailable</p>
                <button
                    type="button"
                    onClick={() => void refetch()}
                    className="text-brand-700 dark:text-brand-300 mt-2 min-h-11 cursor-pointer text-sm font-semibold underline underline-offset-4"
                >
                    Try again
                </button>
            </div>
        );
    }

    const balances = groupBalances?.balances ?? [];
    const transactions = groupBalances?.settlements ?? [];
    const hasFinancialActivity = balances.length > 0 || transactions.length > 0;
    if (!hasFinancialActivity) {
        return (
            <div className="border-border rounded-xl border p-4">
                <p className="text-muted-foreground font-medium">No balances yet</p>
                {isBalancesFetching && <FetchingIndicator />}
            </div>
        );
    }

    const currentUserId = currentUser?.id ?? '';
    const balancesByUserId = new Map(balances.map((balance) => [balance.userId, balance.balance]));
    const balance = balancesByUserId.get(currentUserId) ?? 0;
    const isGroupFullySettled =
        members.length > 0 &&
        balances.length > 0 &&
        members.every((member) => (balancesByUserId.get(member.id) ?? 0) === 0);
    const personalTransactions = transactions.filter(({ fromUserId, toUserId }) =>
        [fromUserId, toUserId].includes(currentUserId),
    );
    const toPay = personalTransactions
        .filter(({ fromUserId }) => fromUserId === currentUserId)
        .reduce((total, item) => total + item.amount, 0);
    const toReceive = personalTransactions
        .filter(({ toUserId }) => toUserId === currentUserId)
        .reduce((total, item) => total + item.amount, 0);

    if (isGroupFullySettled) {
        return (
            <div className="border-border bg-muted/40 relative rounded-xl border p-4">
                <SettlementConfetti
                    key={`${groupId}-group`}
                    groupId={groupId}
                    celebration="group"
                />
                <p className="font-display text-settled text-lg font-medium">
                    Everyone is settled up
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                    No outstanding balances in this group
                </p>
                {isBalancesFetching && <FetchingIndicator />}
            </div>
        );
    }

    const isMixedPosition = toPay > 0 && toReceive > 0;
    const isPersonallySettled = balance === 0;
    let summary: ReactNode;
    if (isMixedPosition) {
        summary = (
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-owed">To receive {formatCurrency(toReceive)}</span>
                <span aria-hidden="true" className="text-muted-foreground">
                    ·
                </span>
                <span className="text-owe">To pay {formatCurrency(toPay)}</span>
            </span>
        );
    } else if (balance > 0) {
        summary = <span className="text-owed">You are owed {formatCurrency(balance)}</span>;
    } else if (balance < 0) {
        summary = <span className="text-owe">You owe {formatCurrency(Math.abs(balance))}</span>;
    } else {
        summary = <span className="text-settled">You are settled up</span>;
    }

    return (
        <div className="relative">
            {isPersonallySettled && (
                <SettlementConfetti
                    key={`${groupId}-personal`}
                    groupId={groupId}
                    celebration="personal"
                />
            )}
            <Link
                to={`/groups/${groupId}/balance`}
                className="border-border bg-surface hover:bg-muted focus-visible:ring-brand-500 flex min-h-16 w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border p-4 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
                <span className="font-display min-w-0 flex-1 text-lg font-medium">{summary}</span>
                <span className="flex shrink-0 items-center gap-2">
                    <span className="text-surface-foreground flex items-center gap-1 text-sm font-semibold sm:text-base">
                        View balances
                        <ArrowRight aria-hidden="true" className="size-4" />
                    </span>
                    {isBalancesFetching && <FetchingIndicator />}
                </span>
            </Link>
        </div>
    );
}
