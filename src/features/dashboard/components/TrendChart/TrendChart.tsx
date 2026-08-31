import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { SpendingTrendChart } from '@features/dashboard/components/SpendingTrendChart';
import { combineDailySpending, combineMonthlySpending } from '@features/dashboard/utils';

export type TrendChartProps = Readonly<{
    groups: DashboardGroupSpend[];
    selected?: DashboardGroupSpend;
    dailyTrend: boolean;
}>;

export function TrendChart({ groups, selected, dailyTrend }: TrendChartProps) {
    if (selected) {
        return dailyTrend ? (
            <SpendingTrendChart data={selected.spendingByDay} granularity="day" />
        ) : (
            <SpendingTrendChart data={selected.spendingByMonth} granularity="month" />
        );
    }
    if (dailyTrend) {
        const dailyData = groups.every((group) => group.spendingByDay !== undefined)
            ? combineDailySpending(groups)
            : undefined;
        return <SpendingTrendChart data={dailyData} granularity="day" />;
    }
    return <SpendingTrendChart data={combineMonthlySpending(groups)} granularity="month" />;
}
