import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { SpendingTrendGraph } from '@features/dashboard/components';
import { combineDailySpending, combineMonthlySpending } from '@features/dashboard/utils';

export type AnalyticsTrendChartProps = Readonly<{
    groups: DashboardGroupSpend[];
    selected?: DashboardGroupSpend;
    dailyTrend: boolean;
}>;
export function AnalyticsTrendChart({ groups, selected, dailyTrend }: AnalyticsTrendChartProps) {
    if (dailyTrend) {
        let data = selected?.spendingByDay;
        if (!selected && groups.every((group) => group.spendingByDay !== undefined))
            data = combineDailySpending(groups);
        return <SpendingTrendGraph data={data} granularity="day" />;
    }
    return (
        <SpendingTrendGraph
            data={selected ? selected.spendingByMonth : combineMonthlySpending(groups)}
            granularity="month"
        />
    );
}
