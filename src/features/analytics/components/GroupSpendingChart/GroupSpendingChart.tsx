import { Bar, BarChart } from 'recharts';
import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { monthLabel, shortDayLabel } from '@features/dashboard/utils';
import { AccessibleChartTable } from '@features/analytics/components/AccessibleChartTable';
import { ChartAxes } from '@features/analytics/components/ChartAxes';
import { ChartTooltip } from '@features/analytics/components/ChartTooltip';
import { ScrollableChart } from '@features/analytics/components/ScrollableChart';
import {
    ANALYTICS_BAR_RADIUS,
    ANALYTICS_CHART_COLORS,
    ANALYTICS_CHART_MARGIN,
    MIN_BAR_WIDTH,
    MIN_CATEGORY_WIDTH,
    bucketGroupSpending,
    niceTicks,
} from '@features/analytics/utils';
import { formatCurrency } from '@shared/utils';

export type GroupSpendingChartProps = Readonly<{
    groups: DashboardGroupSpend[];
    dailyTrend: boolean;
}>;
interface GroupBucketRow {
    name: string;
    [groupId: string]: string | number;
}

export function GroupSpendingChart({ groups, dailyTrend }: GroupSpendingChartProps) {
    const active = groups.filter((group) => group.amount > 0);
    const daily = dailyTrend && active.every((group) => group.spendingByDay !== undefined);
    const buckets = bucketGroupSpending(active, daily ? 'day' : 'month');
    const chartData: GroupBucketRow[] = buckets.map(({ bucket, amounts }) => ({
        ...amounts,
        name: daily ? shortDayLabel(bucket) : monthLabel(bucket),
    }));
    if (active.length === 0 || chartData.length === 0)
        return <p className="text-muted-foreground mt-6 text-sm">No spending in this period.</p>;
    const legend = active.map((group, index) => ({
        name: group.name,
        fill: ANALYTICS_CHART_COLORS[index % ANALYTICS_CHART_COLORS.length]!,
    }));
    const ticks = niceTicks(
        Math.max(...buckets.flatMap(({ amounts }) => Object.values(amounts)), 0),
    );
    return (
        <>
            <ScrollableChart
                categories={chartData.length}
                perCategory={Math.max(MIN_CATEGORY_WIDTH, active.length * MIN_BAR_WIDTH)}
                label="Spending by group chart"
                ticks={ticks}
                legend={legend}
            >
                <BarChart data={chartData} margin={ANALYTICS_CHART_MARGIN}>
                    <ChartAxes ticks={ticks} />
                    <ChartTooltip />
                    {active.map((group, index) => (
                        <Bar
                            key={group.groupId}
                            dataKey={group.groupId}
                            name={group.name}
                            fill={ANALYTICS_CHART_COLORS[index % ANALYTICS_CHART_COLORS.length]}
                            radius={ANALYTICS_BAR_RADIUS}
                            isAnimationActive
                        />
                    ))}
                </BarChart>
            </ScrollableChart>
            <AccessibleChartTable
                caption="Spending by group values"
                headers={[daily ? 'Day' : 'Month', ...active.map((group) => group.name)]}
                rows={chartData.map((entry) => (
                    <tr key={entry.name}>
                        <th>{entry.name}</th>
                        {active.map((group) => (
                            <td key={group.groupId}>
                                {formatCurrency(Number(entry[group.groupId] ?? 0))}
                            </td>
                        ))}
                    </tr>
                ))}
            />
        </>
    );
}
