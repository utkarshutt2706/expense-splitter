import { ChevronRight, UsersRound } from 'lucide-react';
import { Link } from 'react-router';

import type { GroupSummary } from '@features/groups/api/groupsApi';
import { formatCurrency } from '@shared/utils';

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
});

function balanceStatus(group: GroupSummary): { text: string; className: string } {
    if (!group.hasFinancialActivity) {
        return { text: 'No balance', className: 'text-muted-foreground' };
    }
    if (group.currentUserBalance > 0) {
        return {
            text: `You are owed ${formatCurrency(group.currentUserBalance)}`,
            className: 'text-green-700 dark:text-green-400',
        };
    }
    if (group.currentUserBalance < 0) {
        return {
            text: `You owe ${formatCurrency(Math.abs(group.currentUserBalance))}`,
            className: 'text-red-600 dark:text-red-400',
        };
    }
    return { text: 'Settled up', className: 'text-muted-foreground' };
}

export function GroupCard({ group }: Readonly<{ group: GroupSummary }>) {
    const status = balanceStatus(group);
    const activity = group.lastActivityAt
        ? `Last activity ${dateFormatter.format(new Date(group.lastActivityAt))}`
        : 'No expenses yet';

    return (
        <Link
            to={`/groups/${group.id}`}
            className="border-border hover:bg-muted focus-visible:ring-brand-500 flex min-h-20 items-start gap-3 rounded-xl border p-4 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:items-center sm:gap-4"
        >
            <span
                aria-hidden="true"
                className="bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 flex size-11 shrink-0 items-center justify-center rounded-full"
            >
                <UsersRound className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-surface-foreground font-semibold break-words">{group.name}</p>
                <p className="text-muted-foreground mt-1 text-sm sm:inline">
                    {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                </p>
                <span aria-hidden="true" className="text-muted-foreground hidden px-1.5 sm:inline">
                    ·
                </span>
                <p className="text-muted-foreground text-sm sm:inline">{activity}</p>
                <p className={`mt-3 font-semibold sm:hidden ${status.className}`}>{status.text}</p>
            </div>
            <div className="hidden shrink-0 items-center gap-3 sm:flex">
                <span className={`font-semibold ${status.className}`}>{status.text}</span>
                <ChevronRight aria-hidden="true" className="text-muted-foreground size-5" />
            </div>
            <ChevronRight
                aria-hidden="true"
                className="text-muted-foreground mt-1 size-5 shrink-0 sm:hidden"
            />
        </Link>
    );
}
