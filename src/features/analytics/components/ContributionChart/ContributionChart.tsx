import { Bar, BarChart, Tooltip } from 'recharts';
import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { AccessibleChartTable } from '@features/analytics/components/AccessibleChartTable';
import { ChartAxes } from '@features/analytics/components/ChartAxes';
import {
    ContributionTooltip,
    type ContributionDatum,
} from '@features/analytics/components/ContributionTooltip';
import { ScrollableChart } from '@features/analytics/components/ScrollableChart';
import {
    ANALYTICS_BAR_RADIUS,
    ANALYTICS_CHART_MARGIN,
    contributionBalance,
    contributionBalanceLabel,
    niceTicks,
    periodPoints,
} from '@features/analytics/utils';
import { formatCurrency } from '@shared/utils';

export type ContributionChartProps = Readonly<{
    groups: DashboardGroupSpend[];
    dailyTrend: boolean;
}>;
export function ContributionChart({ groups, dailyTrend }: ContributionChartProps) {
    const { daily, points } = periodPoints(groups, dailyTrend);
    const chartData: ContributionDatum[] = points.map((point) => ({
        name: point.label,
        paid: point.actualPaid,
        share: point.currentUserShare,
    }));
    if (chartData.length === 0)
        return <p className="text-muted-foreground mt-6 text-sm">No spending in this period.</p>;
    const series = [
        { dataKey: 'paid', name: 'Paid by you', fill: 'var(--color-brand-600)' },
        { dataKey: 'share', name: 'Your share', fill: 'var(--color-brand-300)' },
    ] as const;
    const ticks = niceTicks(
        Math.max(...chartData.flatMap((entry) => [entry.paid, entry.share]), 0),
    );
    return (
        <>
            <ScrollableChart
                categories={chartData.length}
                label="Paid versus share chart"
                ticks={ticks}
                legend={series}
            >
                <BarChart data={chartData} margin={ANALYTICS_CHART_MARGIN}>
                    <ChartAxes ticks={ticks} />
                    <Tooltip cursor={{ fill: 'var(--muted)' }} content={<ContributionTooltip />} />
                    {series.map((bar) => (
                        <Bar
                            key={bar.dataKey}
                            dataKey={bar.dataKey}
                            name={bar.name}
                            fill={bar.fill}
                            radius={ANALYTICS_BAR_RADIUS}
                            isAnimationActive
                        />
                    ))}
                </BarChart>
            </ScrollableChart>
            <AccessibleChartTable
                caption="Paid versus share values"
                headers={[daily ? 'Day' : 'Month', 'Paid by you', 'Your share', 'Balance']}
                rows={chartData.map((entry) => {
                    const { owed, owe } = contributionBalance(entry.paid, entry.share);
                    return (
                        <tr key={entry.name}>
                            <th>{entry.name}</th>
                            <td>{formatCurrency(entry.paid)}</td>
                            <td>{formatCurrency(entry.share)}</td>
                            <td>{contributionBalanceLabel(owed, owe)}</td>
                        </tr>
                    );
                })}
            />
        </>
    );
}
