import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronDown } from 'lucide-react';
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
import { formatCurrency } from '@shared/utils';
import { addSingletonEndpoints } from './spendingTrendChartData';

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

type SpendingTrendChartProps = Readonly<
    | { data?: DashboardDailySpend[]; granularity: 'day' }
    | { data: DashboardMonthlySpend[]; granularity: 'month' }
>;

export function SpendingTrendChart({ data, granularity }: SpendingTrendChartProps) {
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [periodPopoverOpen, setPeriodPopoverOpen] = useState(false);
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
    const plottedData = addSingletonEndpoints(
        chartData,
        granularity,
        granularity === 'day' ? dayLabel : monthLabel,
    );
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
            <div className="touch-device-only border-border bg-muted/40 mt-4 rounded-lg border p-3">
                <span id="dashboard-chart-period-label" className="text-sm font-medium">
                    View chart values
                </span>
                <Popover.Root open={periodPopoverOpen} onOpenChange={setPeriodPopoverOpen}>
                    <Popover.Trigger asChild>
                        <button
                            type="button"
                            aria-labelledby="dashboard-chart-period-label dashboard-chart-period-value"
                            aria-haspopup="listbox"
                            aria-expanded={periodPopoverOpen}
                            className="border-border bg-surface focus-visible:ring-brand-500 mt-1 flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-md border px-3 text-left outline-none focus-visible:ring-2"
                        >
                            <span id="dashboard-chart-period-value" className="truncate">
                                {selected.label}
                            </span>
                            <ChevronDown
                                aria-hidden="true"
                                className={`text-muted-foreground size-4 shrink-0 transition-transform ${periodPopoverOpen ? 'rotate-180' : ''}`}
                            />
                        </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                        <Popover.Content
                            align="start"
                            sideOffset={8}
                            role="listbox"
                            aria-label="Choose chart date"
                            className="border-border bg-surface z-50 w-[var(--radix-popover-trigger-width)] rounded-lg border p-2 shadow-lg"
                        >
                            <div className="max-h-64 overflow-y-auto">
                                {chartData.map((entry) => (
                                    <button
                                        key={entry.period}
                                        type="button"
                                        role="option"
                                        aria-selected={entry.period === selected.period}
                                        onClick={() => {
                                            setSelectedPeriod(entry.period);
                                            setPeriodPopoverOpen(false);
                                        }}
                                        className="hover:bg-muted focus-visible:bg-muted flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2 text-left outline-none"
                                    >
                                        <span className="truncate">{entry.label}</span>
                                        {entry.period === selected.period && (
                                            <Check
                                                aria-hidden="true"
                                                className="text-brand-600 size-4 shrink-0"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </Popover.Content>
                    </Popover.Portal>
                </Popover.Root>
                <dl className="mt-3 space-y-2 text-sm" aria-live="polite">
                    {[
                        ['Total group spending', selected.amount],
                        ['Your share', selected.currentUserShare],
                        ['Paid by you', selected.actualPaid],
                    ].map(([label, value]) => (
                        <div key={String(label)} className="flex justify-between gap-3">
                            <dt className="text-muted-foreground">{label}</dt>
                            <dd className="shrink-0 font-semibold tabular-nums">
                                {formatCurrency(Number(value))}
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
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
                            tickFormatter={formatCurrency}
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
                            isAnimationActive={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="currentUserShare"
                            name="Your share"
                            stroke="var(--color-brand-600)"
                            strokeWidth={3}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                            isAnimationActive={false}
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
                                <td>{formatCurrency(entry.amount)}</td>
                                <td>{formatCurrency(entry.actualPaid)}</td>
                                <td>{formatCurrency(entry.currentUserShare)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
