import { useState } from 'react';
import { Link } from 'react-router';

import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { BalanceText } from '@features/dashboard/components/BalanceText';
import { GroupContribution } from '@features/dashboard/components/GroupContribution';
import { formatCurrency } from '@shared/utils';

export type GroupBreakdownProps = Readonly<{ groups: DashboardGroupSpend[] }>;

export function GroupBreakdown({ groups }: GroupBreakdownProps) {
    const [showAll, setShowAll] = useState(false);
    const visible = showAll ? groups : groups.slice(0, 6);
    const compareWithBars = groups.length > 1;
    return (
        <section aria-labelledby="groups-heading" className="space-y-4">
            <div>
                <h2 id="groups-heading" className="text-2xl font-semibold">
                    Spending by group
                </h2>
                <p className="text-muted-foreground text-sm">
                    Compare what you paid with your assigned share.
                </p>
            </div>
            <div className="space-y-3">
                {visible.map((group) => (
                    <Link
                        key={group.groupId}
                        to={`/groups/${group.groupId}`}
                        className="border-border bg-surface hover:border-brand-400 focus-visible:ring-brand-500 block cursor-pointer rounded-2xl border p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none xl:grid xl:grid-cols-[minmax(12rem,1fr)_minmax(16rem,1.3fr)_10rem] xl:items-center xl:gap-6"
                    >
                        <div className="min-w-0">
                            <h3 className="truncate font-semibold" title={group.name}>
                                {group.name}
                            </h3>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Total group spending{' '}
                                <span className="text-surface-foreground font-medium">
                                    {formatCurrency(group.amount)}
                                </span>
                            </p>
                        </div>
                        <GroupContribution group={group} compareWithBars={compareWithBars} />
                        <div className="border-border mt-4 border-t pt-3 text-sm xl:mt-0 xl:border-0 xl:pt-0 xl:text-right">
                            <BalanceText value={group.currentBalance} />
                        </div>
                    </Link>
                ))}
            </div>
            {groups.length > 6 && (
                <button
                    type="button"
                    onClick={() => setShowAll((value) => !value)}
                    className="focus-visible:ring-brand-500 min-h-11 cursor-pointer rounded-lg px-3 text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none"
                >
                    {showAll ? 'Show fewer groups' : `View all ${groups.length} groups`}
                </button>
            )}
        </section>
    );
}
