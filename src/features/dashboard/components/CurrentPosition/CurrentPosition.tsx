import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';

import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { PositionBalance } from '@features/dashboard/components/PositionBalance';

export type CurrentPositionProps = Readonly<{
    groups: DashboardGroupSpend[];
    selected?: DashboardGroupSpend;
    periodLabel: string;
}>;

export function CurrentPosition({ groups, selected, periodLabel }: CurrentPositionProps) {
    const relevant = selected ? [selected] : groups;
    const receive = relevant.reduce((sum, group) => sum + Math.max(group.currentBalance, 0), 0);
    const pay = relevant.reduce((sum, group) => sum + Math.max(-group.currentBalance, 0), 0);

    return (
        <section
            aria-labelledby="position-heading"
            className="border-border bg-surface rounded-2xl border p-5 md:flex md:items-center md:justify-between md:gap-6 md:p-6"
        >
            <div>
                <p id="position-heading" className="text-muted-foreground text-sm font-medium">
                    Position for {periodLabel.toLocaleLowerCase()}
                </p>
                <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-2xl">
                    <PositionBalance receive={receive} pay={pay} selected={selected} />
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                    Includes all recorded expenses and settlement payments.
                </p>
            </div>
            {selected && (
                <Link
                    className="border-border bg-surface hover:bg-muted focus-visible:ring-brand-500 mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none md:mt-0"
                    to={`/groups/${selected.groupId}/balance`}
                >
                    View balances
                    <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
            )}
        </section>
    );
}
