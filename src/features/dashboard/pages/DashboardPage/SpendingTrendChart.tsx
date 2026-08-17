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

import type { DashboardMonthlySpend } from '@features/dashboard/api/dashboardApi';
import { formatMoney } from './dashboardMetrics';

function monthLabel(month: string): string {
    return new Intl.DateTimeFormat('en-IN', {
        month: 'short',
        year: '2-digit',
        timeZone: 'UTC',
    }).format(new Date(`${month}-01T00:00:00Z`));
}

function compactMoney(value: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value);
}

export function SpendingTrendChart({ data }: Readonly<{ data: DashboardMonthlySpend[] }>) {
    if (data.length === 0) return null;
    const chartData = data.map((entry) => ({ ...entry, label: monthLabel(entry.month) }));

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
                    Monthly recorded expenses. Settlement payments are excluded.
                </p>
            </div>
            <div className="mt-6 h-72 w-full" aria-label="Monthly spending chart">
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
            <table className="sr-only">
                <caption>Monthly spending values</caption>
                <thead>
                    <tr>
                        <th>Month</th>
                        <th>Total group spending</th>
                        <th>Paid by you</th>
                        <th>Your share</th>
                    </tr>
                </thead>
                <tbody>
                    {chartData.map((entry) => (
                        <tr key={entry.month}>
                            <th>{entry.label}</th>
                            <td>{formatMoney(entry.amount)}</td>
                            <td>{formatMoney(entry.actualPaid)}</td>
                            <td>{formatMoney(entry.currentUserShare)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}
