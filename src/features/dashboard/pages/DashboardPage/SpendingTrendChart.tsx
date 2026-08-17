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
import { useState } from 'react';

import type {
    DashboardDailySpend,
    DashboardMonthlySpend,
} from '@features/dashboard/api/dashboardApi';
import { formatMoney } from './dashboardMetrics';

function monthLabel(month: string): string {
    return new Intl.DateTimeFormat('en-IN', {
        month: 'short',
        year: '2-digit',
        timeZone: 'UTC',
    }).format(new Date(`${month}-01T00:00:00Z`));
}

function dayLabel(date: string): string {
    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`));
}

function compactMoney(value: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value);
}

type SpendingTrendChartProps = Readonly<
    | { data?: DashboardDailySpend[]; granularity: 'day' }
    | { data: DashboardMonthlySpend[]; granularity: 'month' }
>;

export function SpendingTrendChart({ data, granularity }: SpendingTrendChartProps) {
    const [selectedPeriod, setSelectedPeriod] = useState('');
    if (data === undefined)
        return (
            <section className="border-border bg-muted/40 rounded-2xl border p-5 md:p-6">
                <h2 className="font-display text-xl font-semibold">Daily trend unavailable</h2>
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
    const selected =
        chartData.find((entry) => entry.period === selectedPeriod) ?? chartData.at(-1)!;
    const periodName = granularity === 'day' ? 'Daily' : 'Monthly';

    return (
        <section
            aria-labelledby="trend-heading"
            className="border-border bg-surface rounded-2xl border p-5 md:p-6"
        >
            <div>
                <h2 id="trend-heading" className="font-display text-2xl font-semibold">
                    Spending over time
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    {periodName} recorded expenses. Settlement payments are excluded.
                </p>
            </div>
            <div className="border-border bg-muted/40 mt-4 rounded-lg border p-3 sm:hidden">
                <label className="text-sm font-medium" htmlFor="dashboard-chart-period">
                    View chart values
                </label>
                <select
                    id="dashboard-chart-period"
                    value={selected.period}
                    onChange={(event) => setSelectedPeriod(event.target.value)}
                    className="border-border bg-surface mt-1 min-h-11 w-full cursor-pointer rounded-md border px-3"
                >
                    {chartData.map((entry) => (
                        <option key={entry.period} value={entry.period}>
                            {entry.label}
                        </option>
                    ))}
                </select>
                <dl className="mt-3 space-y-2 text-sm" aria-live="polite">
                    {[
                        ['Total group spending', selected.amount],
                        ['Paid by you', selected.actualPaid],
                        ['Your share', selected.currentUserShare],
                    ].map(([label, value]) => (
                        <div key={String(label)} className="flex justify-between gap-3">
                            <dt className="text-muted-foreground">{label}</dt>
                            <dd className="shrink-0 font-semibold tabular-nums">
                                {formatMoney(Number(value))}
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
            <div className="mt-6 h-72 w-full" aria-label={`${periodName} spending chart`}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={chartData}
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
                            tickFormatter={compactMoney}
                            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            formatter={(value) => formatMoney(Number(value))}
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
                            isAnimationActive={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="actualPaid"
                            name="Paid by you"
                            stroke="var(--color-brand-600)"
                            strokeWidth={3}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                            isAnimationActive={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="currentUserShare"
                            name="Your share"
                            stroke="var(--muted-foreground)"
                            strokeWidth={2}
                            strokeDasharray="6 4"
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                            isAnimationActive={false}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
            <div className="fixed top-0 left-0 size-px overflow-hidden whitespace-nowrap [clip-path:inset(50%)]">
                <table>
                    <caption>{periodName} spending values</caption>
                    <thead>
                        <tr>
                            <th>{granularity === 'day' ? 'Date' : 'Month'}</th>
                            <th>Total group spending</th>
                            <th>Paid by you</th>
                            <th>Your share</th>
                        </tr>
                    </thead>
                    <tbody>
                        {chartData.map((entry) => (
                            <tr key={entry.period}>
                                <th>{entry.label}</th>
                                <td>{formatMoney(entry.amount)}</td>
                                <td>{formatMoney(entry.actualPaid)}</td>
                                <td>{formatMoney(entry.currentUserShare)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
