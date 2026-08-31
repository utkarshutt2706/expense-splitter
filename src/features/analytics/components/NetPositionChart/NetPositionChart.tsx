import {
    Bar,
    BarChart,
    CartesianGrid,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { AccessibleChartTable } from '@features/analytics/components/AccessibleChartTable';
import {
    ANALYTICS_CHART_MARGIN,
    ANALYTICS_CHART_TICK,
    ANALYTICS_CHART_TOOLTIP_STYLE,
    cumulativeNetPosition,
    periodPoints,
} from '@features/analytics/utils';
import { formatCompactCurrency, formatCurrency } from '@shared/utils';

export type NetPositionChartProps = Readonly<{
    groups: DashboardGroupSpend[];
    dailyTrend: boolean;
}>;
export function NetPositionChart({ groups, dailyTrend }: NetPositionChartProps) {
    const { daily, points } = periodPoints(groups, dailyTrend);
    const chartData = cumulativeNetPosition(points).map(({ entry, net, cumulative }) => ({
        name: entry.label,
        net,
        cumulative,
        fill: cumulative < 0 ? 'var(--color-owe)' : 'var(--color-owed)',
    }));
    if (chartData.length === 0)
        return <p className="text-muted-foreground mt-6 text-sm">No spending in this period.</p>;
    const closing = chartData.at(-1)?.cumulative ?? 0;
    let description = 'You ended this period level with your share.';
    if (closing > 0)
        description = `By the end of this period you had fronted ${formatCurrency(closing)} more than your share.`;
    else if (closing < 0)
        description = `By the end of this period others had covered ${formatCurrency(Math.abs(closing))} of your share.`;
    return (
        <>
            <p className="text-muted-foreground mt-4 text-sm">{description}</p>
            <div className="mt-4 h-72 w-full min-w-0" aria-label="Net position over time chart">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={ANALYTICS_CHART_MARGIN}>
                        <CartesianGrid
                            stroke="var(--border-color)"
                            strokeDasharray="3 3"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="name"
                            tick={ANALYTICS_CHART_TICK}
                            tickLine={false}
                            interval="preserveStartEnd"
                            axisLine={{ stroke: 'var(--border-color)' }}
                        />
                        <YAxis
                            width={58}
                            tickFormatter={formatCompactCurrency}
                            tick={ANALYTICS_CHART_TICK}
                            tickLine={false}
                            axisLine={false}
                        />
                        <ReferenceLine y={0} stroke="var(--muted-foreground)" />
                        <Tooltip
                            cursor={{ fill: 'var(--muted)' }}
                            formatter={(value) => formatCurrency(Number(value))}
                            contentStyle={ANALYTICS_CHART_TOOLTIP_STYLE}
                        />
                        <Bar dataKey="cumulative" name="Running position" isAnimationActive />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <AccessibleChartTable
                caption="Net position over time values"
                headers={[daily ? 'Day' : 'Month', 'Change', 'Running position']}
                rows={chartData.map((entry) => (
                    <tr key={entry.name}>
                        <th>{entry.name}</th>
                        <td>{formatCurrency(entry.net)}</td>
                        <td>{formatCurrency(entry.cumulative)}</td>
                    </tr>
                ))}
            />
        </>
    );
}
