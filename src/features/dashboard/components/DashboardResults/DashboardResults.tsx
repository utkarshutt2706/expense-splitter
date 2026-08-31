import type { DashboardGroupSpend, DashboardSummary } from '@features/dashboard/api/dashboardApi';
import { CurrentPosition } from '@features/dashboard/components/CurrentPosition';
import { EmptyDashboard } from '@features/dashboard/components/EmptyDashboard';
import { GroupBreakdown } from '@features/dashboard/components/GroupBreakdown';
import { NoSpendingState } from '@features/dashboard/components/NoSpendingState';
import { Participants } from '@features/dashboard/components/Participants';
import { SpendingSummary } from '@features/dashboard/components/SpendingSummary';
import { TrendChart } from '@features/dashboard/components/TrendChart';
import { usesDailyTrend, type DashboardPeriod } from '@features/dashboard/utils';

export type DashboardResultsProps = Readonly<{
    data: DashboardSummary;
    selected?: DashboardGroupSpend;
    period: DashboardPeriod;
}>;

export function DashboardResults({ data, selected, period }: DashboardResultsProps) {
    if (data.groupSpend.length === 0) return <EmptyDashboard />;
    const dailyTrend = usesDailyTrend(period);
    if (selected) {
        return (
            <>
                {period.preset === 'all-time' && (
                    <CurrentPosition
                        groups={data.groupSpend}
                        selected={selected}
                        periodLabel={period.label}
                    />
                )}
                {selected.amount > 0 ? (
                    <>
                        <SpendingSummary
                            paid={selected.actualPaid}
                            share={selected.currentUserShare}
                            total={selected.amount}
                            periodLabel={period.label}
                        />
                        <TrendChart
                            groups={data.groupSpend}
                            selected={selected}
                            dailyTrend={dailyTrend}
                        />
                    </>
                ) : (
                    <NoSpendingState
                        description="Try another time period or add an expense to this group."
                        link={`/groups/${selected.groupId}/expenses/new`}
                        linkLabel="Add expense"
                    />
                )}
                <Participants group={selected} />
            </>
        );
    }
    const hasExpenses = data.groupSpend.some((group) => group.amount > 0);
    return (
        <>
            {period.preset === 'all-time' && (
                <CurrentPosition groups={data.groupSpend} periodLabel={period.label} />
            )}
            <SpendingSummary
                paid={data.actualPaid}
                share={data.currentUserShare}
                periodLabel={period.label}
            />
            <TrendChart groups={data.groupSpend} dailyTrend={dailyTrend} />
            {hasExpenses ? (
                <GroupBreakdown groups={data.groupSpend} />
            ) : (
                <NoSpendingState
                    description="Try another time period or add an expense to a group."
                    link={data.groupSpend[0] ? `/groups/${data.groupSpend[0].groupId}` : undefined}
                    linkLabel="Open group"
                />
            )}
        </>
    );
}
