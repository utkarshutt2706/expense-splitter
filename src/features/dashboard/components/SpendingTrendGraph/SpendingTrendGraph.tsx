import {
    Area,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import type {
    DashboardDailySpend,
    DashboardMonthlySpend,
} from '@features/dashboard/api/dashboardApi';
import { formatCompactCurrency, formatCurrency } from '@shared/utils';
import { dayLabel, monthLabel } from '@features/dashboard/utils/periodLabels';
import { addSingletonEndpoints } from '@features/dashboard/utils/spendingTrendChartData';

type SpendingTrendGraphProps = Readonly<
    | { data?: DashboardDailySpend[]; granularity: 'day' }
    | { data: DashboardMonthlySpend[]; granularity: 'month' }
>;

export function SpendingTrendGraph({ data, granularity }: SpendingTrendGraphProps) {
    if (data === undefined)
        return (
            <section className="border-border bg-muted/40 rounded-2xl border p-5 md:p-6">
                <h2 className="text-xl font-semibold">Daily trend unavailable</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    Refresh after the dashboard server has been updated.
                </p>
            </section>
        );
    if (data.length === 0) return null;
    const chartData = data.map((entry) => {
        const period = 'date' in entry ? entry.date : entry.month;
        return {
            ...entry,
            period,
            label: granularity === 'day' ? dayLabel(period) : monthLabel(period),
        };
    });
    const plottedData = addSingletonEndpoints(
        chartData,
        granularity,
        granularity === 'day' ? dayLabel : monthLabel,
    );
    const periodName = granularity === 'day' ? 'Daily' : 'Monthly';

    return (
        <div className="mt-6 h-72 w-full" aria-label={`${periodName} spending chart`}>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={plottedData}
                    margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                    accessibilityLayer
                >
                    <CartesianGrid
                        stroke="var(--border-color)"
                        strokeDasharray="3 3"
                        vertical={false}
                    />
                    <XAxis
                        dataKey="label"
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: 'var(--border-color)' }}
                    />
                    <YAxis
                        width={58}
                        tickFormatter={formatCompactCurrency}
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                        contentStyle={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '0.75rem',
                            color: 'var(--surface-foreground)',
                        }}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '0.75rem' }} />
                    <Area
                        type="monotone"
                        dataKey="amount"
                        name="Total group spending"
                        fill="var(--color-brand-100)"
                        stroke="var(--color-brand-400)"
                        fillOpacity={0.5}
                        isAnimationActive={true}
                    />
                    <Line
                        type="monotone"
                        dataKey="currentUserShare"
                        name="Your share"
                        stroke="var(--color-brand-600)"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        isAnimationActive={true}
                    />
                    <Line
                        type="monotone"
                        dataKey="actualPaid"
                        name="Paid by you"
                        stroke="var(--muted-foreground)"
                        strokeWidth={2}
                        strokeDasharray="6 4"
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        isAnimationActive={true}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
