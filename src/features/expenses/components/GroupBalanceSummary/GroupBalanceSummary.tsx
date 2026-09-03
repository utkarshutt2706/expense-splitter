import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { useCurrentUser } from '@app/hooks';
import type { User } from '@features/users/api/usersApi';
import { useGroupBalances } from '@features/balances/hooks/useGroupBalances';
import { SettlementConfetti } from '@features/balances/components/SettlementConfetti';
import { balanceSummaryViewModel } from '@features/balances/utils/balanceSummaryViewModel';
import { FetchingIndicator, Skeleton } from '@shared/components';
import { formatCurrency } from '@shared/utils';

type GroupBalanceSummaryProps = Readonly<{
    groupId: string;
    members: User[];
}>;

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

    const model = balanceSummaryViewModel(
        groupBalances ?? { balances: [], settlements: [] },
        members,
        currentUser?.id ?? '',
    );
    const { hasFinancialActivity } = model;
    if (!hasFinancialActivity) {
        return (
            <div className="border-border rounded-xl border p-4">
                <p className="text-muted-foreground font-medium">No balances yet</p>
                {isBalancesFetching && <FetchingIndicator />}
            </div>
        );
    }

    const { balance, isGroupFullySettled, isMixedPosition, isPersonallySettled, toPay, toReceive } =
        model;

    if (isGroupFullySettled) {
        return (
            <div className="border-border bg-muted/40 relative rounded-xl border p-4">
                <SettlementConfetti
                    key={`${groupId}-group`}
                    groupId={groupId}
                    celebration="group"
                />
                <p className="text-settled text-lg font-medium">Everyone is settled up</p>
                <p className="text-muted-foreground mt-1 text-sm">
                    No outstanding balances in this group
                </p>
                {isBalancesFetching && <FetchingIndicator />}
            </div>
        );
    }

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
                <span className="min-w-0 flex-1 text-lg font-medium">{summary}</span>
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
