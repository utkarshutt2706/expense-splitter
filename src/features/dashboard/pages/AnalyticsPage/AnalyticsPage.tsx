import {
    BarChart3,
    BarChartHorizontal,
    Check,
    ChevronDown,
    LineChart,
    PieChart,
    Search,
} from 'lucide-react';
import { useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import type { ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Pie,
    PieChart as RechartsPieChart,
    ResponsiveContainer,
    Sector,
    Tooltip,
    XAxis,
    YAxis,
    type PieSectorShapeProps,
} from 'recharts';

import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { useDashboard } from '@features/dashboard/hooks';
import { formatCurrency } from '@shared/utils';
import { combineDailySpending, combineMonthlySpending } from '../DashboardPage/dashboardMetrics';
import {
    presetPeriod,
    usesDailyTrend,
    type DashboardPeriod,
} from '../DashboardPage/dashboardDateRange';
import { DashboardTimeFilter } from '../DashboardPage/DashboardTimeFilter';
import { SpendingTrendGraph } from '../DashboardPage/SpendingTrendGraph';
import { disambiguateParticipantNames } from './disambiguateParticipantNames';

const COLORS = [
    'var(--color-brand-600)',
    'var(--color-amber-500)',
    'var(--color-emerald-500)',
    'var(--color-rose-500)',
    'var(--color-sky-500)',
    'var(--color-violet-500)',
];

const CHART_MARGIN = {
    top: 8,
    right: 8,
    bottom: 8,
    left: 8,
};

const CHART_TOOLTIP_STYLE = {
    background: 'var(--surface)',
    border: '1px solid var(--border-color)',
    borderRadius: '0.75rem',
    color: 'var(--surface-foreground)',
};

const CHART_TICK = {
    fill: 'var(--muted-foreground)',
    fontSize: 12,
};

const BAR_RADIUS: [number, number, number, number] = [5, 5, 0, 0];

function AnalyticsGroupFilter({
    groups,
    value,
    onChange,
}: Readonly<{
    groups: DashboardGroupSpend[];
    value: string | null;
    onChange: (groupId: string | null) => void;
}>) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const contentRef = useRef<HTMLDivElement>(null);

    const selected = groups.find((group) => group.groupId === value);

    const filteredGroups = groups.filter((group) =>
        group.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
    );

    function select(groupId: string | null) {
        onChange(groupId);
        setOpen(false);
        setQuery('');
    }

    return (
        <div className="w-full text-sm font-medium">
            <span id="analytics-scope-label">Group:</span>

            <Popover.Root
                open={open}
                onOpenChange={(nextOpen) => {
                    setOpen(nextOpen);

                    if (!nextOpen) {
                        setQuery('');
                    }
                }}
            >
                <Popover.Trigger asChild>
                    <button
                        type="button"
                        aria-labelledby="analytics-scope-label analytics-scope-value"
                        aria-haspopup="dialog"
                        aria-expanded={open}
                        className="border-border bg-surface focus-visible:ring-brand-500 mt-1 flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 text-left outline-none focus-visible:ring-2"
                    >
                        <span id="analytics-scope-value" className="truncate">
                            {selected?.name ?? 'All groups'}
                        </span>

                        <ChevronDown className="text-muted-foreground size-4 shrink-0" />
                    </button>
                </Popover.Trigger>

                <Popover.Portal>
                    <Popover.Content
                        ref={contentRef}
                        align="start"
                        sideOffset={8}
                        aria-label="Choose analytics group"
                        onOpenAutoFocus={(event) => {
                            const searchInput =
                                contentRef.current?.querySelector<HTMLInputElement>('input');

                            if (searchInput) {
                                event.preventDefault();
                                searchInput.focus();
                            }
                        }}
                        className="border-border bg-surface z-50 w-[var(--radix-popover-trigger-width)] min-w-72 rounded-lg border p-2 shadow-lg"
                    >
                        {groups.length > 5 && (
                            <label className="relative block">
                                <span className="sr-only">Search groups</span>

                                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />

                                <input
                                    type="search"
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Search groups"
                                    className="border-border bg-surface focus:border-brand-500 focus:ring-brand-500 min-h-11 w-full rounded-lg border pr-3 pl-9 outline-none focus:ring-1"
                                />
                            </label>
                        )}

                        <div
                            className={`${groups.length > 5 ? 'mt-2' : ''} max-h-72 overflow-y-auto`}
                            aria-label="Analytics scopes"
                        >
                            {[
                                ...(!query ? [{ groupId: null, name: 'All groups' }] : []),
                                ...filteredGroups,
                            ].map((group) => (
                                <button
                                    key={group.groupId}
                                    type="button"
                                    onClick={() => select(group.groupId)}
                                    title={group.name}
                                    className="hover:bg-muted focus-visible:bg-muted flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2 text-left outline-none"
                                >
                                    <span className="truncate">{group.name}</span>

                                    {value === group.groupId && (
                                        <Check className="text-brand-600 size-4 shrink-0" />
                                    )}
                                </button>
                            ))}

                            {filteredGroups.length === 0 && (
                                <p className="text-muted-foreground px-3 py-4 text-center">
                                    No groups found
                                </p>
                            )}
                        </div>
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
        </div>
    );
}

function ChartFrame({
    title,
    description,
    icon: Icon,
    children,
}: Readonly<{
    title: string;
    description: string;
    icon: typeof LineChart;
    children: ReactNode;
}>) {
    return (
        <section
            aria-labelledby={`${title}-heading`}
            className="border-border bg-surface rounded-2xl border p-5 md:p-6"
        >
            <div className="flex items-start gap-3">
                <span className="bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <Icon aria-hidden="true" className="size-5" />
                </span>

                <div>
                    <h2 id={`${title}-heading`} className="font-display text-xl font-semibold">
                        {title}
                    </h2>

                    <p className="text-muted-foreground mt-1 text-sm">{description}</p>
                </div>
            </div>

            {children}
        </section>
    );
}

function formatGroupLabel(name: string): string {
    return name.length > 18 ? `${name.slice(0, 16)}...` : name;
}

function ChartAxes() {
    return (
        <>
            <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" vertical={false} />

            <XAxis
                dataKey="name"
                tick={CHART_TICK}
                tickLine={false}
                axisLine={{ stroke: 'var(--border-color)' }}
            />

            <YAxis
                width={58}
                tickFormatter={formatCurrency}
                tick={CHART_TICK}
                tickLine={false}
                axisLine={false}
            />
        </>
    );
}

function ChartTooltip({
    showLabel = false,
}: Readonly<{
    showLabel?: boolean;
}>) {
    return (
        <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            labelFormatter={
                showLabel ? (label, payload) => payload[0]?.payload?.fullName ?? label : undefined
            }
            contentStyle={CHART_TOOLTIP_STYLE}
        />
    );
}

function AccessibleChartTable({
    caption,
    headers,
    rows,
}: Readonly<{
    caption: string;
    headers: string[];
    rows: ReactNode[];
}>) {
    return (
        <div className="fixed top-0 left-0 size-px overflow-hidden whitespace-nowrap [clip-path:inset(50%)]">
            <table>
                <caption>{caption}</caption>

                <thead>
                    <tr>
                        {headers.map((header) => (
                            <th key={header}>{header}</th>
                        ))}
                    </tr>
                </thead>

                <tbody>{rows}</tbody>
            </table>
        </div>
    );
}

function GroupSpendingChart({ groups }: Readonly<{ groups: DashboardGroupSpend[] }>) {
    const chartData = groups
        .filter((group) => group.amount > 0)
        .map((group) => ({
            name: formatGroupLabel(group.name),
            fullName: group.name,
            amount: group.amount,
        }));

    if (chartData.length === 0) {
        return <p className="text-muted-foreground mt-6 text-sm">No spending in this period.</p>;
    }

    return (
        <>
            <div className="mt-6 h-72 w-full min-w-0" aria-label="Spending by group chart">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={CHART_MARGIN}>
                        <ChartAxes />

                        <ChartTooltip showLabel />

                        <Bar
                            dataKey="amount"
                            name="Total spending"
                            fill="var(--color-brand-600)"
                            radius={BAR_RADIUS}
                            isAnimationActive
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <AccessibleChartTable
                caption="Spending by group values"
                headers={['Group', 'Total spending']}
                rows={chartData.map((entry) => (
                    <tr key={entry.fullName}>
                        <th>{entry.fullName}</th>
                        <td>{formatCurrency(entry.amount)}</td>
                    </tr>
                ))}
            />
        </>
    );
}

function ContributionChart({ groups }: Readonly<{ groups: DashboardGroupSpend[] }>) {
    const chartData = groups
        .filter((group) => group.amount > 0)
        .map((group) => ({
            name: formatGroupLabel(group.name),
            fullName: group.name,
            paid: group.actualPaid,
            share: group.currentUserShare,
        }));

    const bars = [
        {
            dataKey: 'paid',
            name: 'Paid by you',
            fill: 'var(--color-brand-600)',
        },
        {
            dataKey: 'share',
            name: 'Your share',
            fill: 'var(--color-amber-500)',
        },
    ];

    if (chartData.length === 0) {
        return <p className="text-muted-foreground mt-6 text-sm">No spending in this period.</p>;
    }

    return (
        <>
            <div className="mt-6 h-72 w-full min-w-0" aria-label="Paid versus share chart">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={CHART_MARGIN}>
                        <ChartAxes />

                        <ChartTooltip showLabel />

                        <Legend
                            wrapperStyle={{
                                fontSize: '0.75rem',
                                paddingTop: '0.75rem',
                            }}
                        />

                        {bars.map((bar) => (
                            <Bar
                                key={bar.dataKey}
                                dataKey={bar.dataKey}
                                name={bar.name}
                                fill={bar.fill}
                                radius={BAR_RADIUS}
                                isAnimationActive
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <AccessibleChartTable
                caption="Paid versus share values"
                headers={['Group', 'Paid by you', 'Your share']}
                rows={chartData.map((entry) => (
                    <tr key={entry.fullName}>
                        <th>{entry.fullName}</th>
                        <td>{formatCurrency(entry.paid)}</td>
                        <td>{formatCurrency(entry.share)}</td>
                    </tr>
                ))}
            />
        </>
    );
}

function ShareDistributionChart({
    group,
}: Readonly<{
    group?: DashboardGroupSpend;
}>) {
    const activeMembers = (group?.memberShares ?? []).filter((member) => member.amount > 0);
    const disambiguatedNames = disambiguateParticipantNames(activeMembers);

    const chartData = activeMembers.map((member, index) => ({
        name: disambiguatedNames[index] ?? member.name,
        amount: member.amount,
        fill: COLORS[index % COLORS.length],
    }));

    if (!group) {
        return (
            <p className="text-muted-foreground mt-6 text-sm">
                Select one group to view participant shares.
            </p>
        );
    }

    if (chartData.length === 0) {
        return (
            <p className="text-muted-foreground mt-6 text-sm">
                No participant spending in this period.
            </p>
        );
    }

    return (
        <>
            <div className="mt-6 h-72 w-full min-w-0" aria-label="Participant share chart">
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                        <Pie
                            data={chartData}
                            dataKey="amount"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius="72%"
                            label={({ name, percent }) =>
                                `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                            }
                            isAnimationActive
                            shape={(props: PieSectorShapeProps) => (
                                <Sector
                                    {...props}
                                    fill={
                                        props.payload?.fill ?? COLORS[props.index % COLORS.length]
                                    }
                                />
                            )}
                        />

                        <ChartTooltip />
                    </RechartsPieChart>
                </ResponsiveContainer>
            </div>

            <AccessibleChartTable
                caption="Participant share values"
                headers={['Participant', 'Share']}
                rows={chartData.map((entry) => (
                    <tr key={entry.name}>
                        <th>{entry.name}</th>
                        <td>{formatCurrency(entry.amount)}</td>
                    </tr>
                ))}
            />
        </>
    );
}

function TrendChart({
    groups,
    selected,
    dailyTrend,
}: Readonly<{
    groups: DashboardGroupSpend[];
    selected?: DashboardGroupSpend;
    dailyTrend: boolean;
}>) {
    if (dailyTrend) {
        const data = selected
            ? selected.spendingByDay
            : groups.every((group) => group.spendingByDay !== undefined)
              ? combineDailySpending(groups)
              : undefined;

        return <SpendingTrendGraph data={data} granularity="day" />;
    }

    const data = selected ? selected.spendingByMonth : combineMonthlySpending(groups);

    return <SpendingTrendGraph data={data} granularity="month" />;
}

function AnalyticsSkeleton() {
    return (
        <div role="status" aria-label="Loading analytics" className="mx-auto max-w-7xl space-y-6">
            <div className="bg-muted h-12 w-72 animate-pulse rounded-lg" />

            <div className="bg-muted h-28 animate-pulse rounded-2xl" />

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="bg-muted h-96 animate-pulse rounded-2xl" />
                <div className="bg-muted h-96 animate-pulse rounded-2xl" />
            </div>
        </div>
    );
}

export function AnalyticsPage() {
    const [searchParams] = useSearchParams();

    const [period, setPeriod] = useState<DashboardPeriod>(() => presetPeriod('this-month'));

    const [scopeGroupId, setScopeGroupId] = useState<string | null>(() =>
        searchParams.get('groupId'),
    );

    const { data, isLoading, isError, refetch } = useDashboard(period.range);

    const selectedGroup = data?.groupSpend.find((group) => group.groupId === scopeGroupId);

    const effectiveGroupId = selectedGroup?.groupId ?? null;

    if (isLoading) {
        return <AnalyticsSkeleton />;
    }

    if (isError || !data) {
        return (
            <div className="mx-auto max-w-xl p-8 text-center">
                <h1 className="font-display text-2xl">We couldn't load analytics</h1>

                <p className="text-muted-foreground mt-2 text-sm">
                    Your expenses have not been changed. Try loading the analytics again.
                </p>

                <button
                    type="button"
                    onClick={() => void refetch()}
                    className="bg-brand-600 hover:bg-brand-700 mt-5 min-h-11 cursor-pointer rounded-lg px-4 text-sm font-semibold text-white"
                >
                    Retry
                </button>
            </div>
        );
    }

    const selected = data.groupSpend.find((group) => group.groupId === effectiveGroupId);

    const dailyTrend = usesDailyTrend(period);

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <header className="flex flex-col gap-4">
                <div>
                    <p className="text-brand-700 dark:text-brand-300 text-sm font-semibold tracking-wide uppercase">
                        Insights
                    </p>

                    <h1 className="font-display text-3xl font-semibold">Spending analytics</h1>

                    <p className="text-muted-foreground mt-1">
                        Explore your shared spending patterns across time, groups, and people.
                    </p>
                </div>

                <div className="flex w-full flex-col gap-3 sm:flex-row">
                    <DashboardTimeFilter period={period} onChange={setPeriod} />

                    {data.groupSpend.length > 1 && (
                        <AnalyticsGroupFilter
                            groups={data.groupSpend}
                            value={effectiveGroupId}
                            onChange={setScopeGroupId}
                        />
                    )}
                </div>
            </header>

            <aside className="border-brand-200 bg-brand-50 text-brand-950 dark:border-brand-800 dark:bg-brand-950/30 dark:text-brand-100 rounded-xl border px-4 py-3 text-sm">
                <strong>Best on web:</strong> Use a larger screen for the clearest chart labels and
                comparisons. The data remains available on smaller devices.
            </aside>

            {data.groupSpend.length === 0 ? (
                <section className="border-border bg-muted/40 rounded-2xl border p-8 text-center">
                    <h2 className="font-display text-2xl">No shared spending yet</h2>

                    <p className="text-muted-foreground mt-2 text-sm">
                        Record a shared expense to see analytics here.
                    </p>

                    <Link
                        to="/groups"
                        className="bg-brand-600 hover:bg-brand-700 mt-5 inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold text-white"
                    >
                        Open groups
                    </Link>
                </section>
            ) : (
                <>
                    <ChartFrame
                        title="Spending trend"
                        description={`${dailyTrend ? 'Daily' : 'Monthly'} recorded expenses. Settlements are excluded.`}
                        icon={LineChart}
                    >
                        <TrendChart
                            groups={data.groupSpend}
                            selected={selected}
                            dailyTrend={dailyTrend}
                        />
                    </ChartFrame>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <ChartFrame
                            title="Spending by group"
                            description="Compare the total recorded expenses in each group."
                            icon={BarChartHorizontal}
                        >
                            <GroupSpendingChart groups={selected ? [selected] : data.groupSpend} />
                        </ChartFrame>

                        <ChartFrame
                            title="Paid versus your share"
                            description="See where your contribution differs from your assigned share."
                            icon={BarChart3}
                        >
                            <ContributionChart groups={selected ? [selected] : data.groupSpend} />
                        </ChartFrame>
                    </div>

                    <ChartFrame
                        title="Participant share"
                        description="Understand how a selected group's expenses are distributed."
                        icon={PieChart}
                    >
                        <ShareDistributionChart group={selected} />
                    </ChartFrame>
                </>
            )}
        </div>
    );
}
