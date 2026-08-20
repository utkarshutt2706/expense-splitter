import { ArrowRight, BarChart3, Plus, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { useDashboard } from '@features/dashboard/hooks';
import { Avatar, Skeleton } from '@shared/components';
import { formatCurrency } from '@shared/utils';
import {
    combineDailySpending,
    combineMonthlySpending,
    comparisonScale,
    contributionCopy,
} from './dashboardMetrics';
import { presetPeriod, usesDailyTrend } from './dashboardDateRange';
import { DashboardTimeFilter } from './DashboardTimeFilter';
import { GroupScopeSelector } from './GroupScopeSelector';
import { SpendingTrendChart } from './SpendingTrendChart';

function BalanceText({
    value,
    short = false,
}: Readonly<{
    value: number;
    short?: boolean;
}>) {
    if (value > 0) {
        return (
            <span className="text-owed font-semibold">
                {short ? 'Owed' : 'You are owed'} {formatCurrency(value)}
            </span>
        );
    }

    if (value < 0) {
        return (
            <span className="text-owe font-semibold">
                {short ? 'Owe' : 'You owe'} {formatCurrency(Math.abs(value))}
            </span>
        );
    }

    return <span className="text-muted-foreground font-semibold">Settled up</span>;
}

function DashboardSkeleton() {
    const filterSkeletons = Array.from({ length: 2 });
    const metricSkeletons = Array.from({ length: 3 });
    const groupSkeletons = Array.from({ length: 2 });

    return (
        <div role="status" aria-label="Loading dashboard" className="mx-auto max-w-7xl space-y-6">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <Skeleton className="h-9 w-64 max-w-full" />
                    <Skeleton className="mt-2 h-5 w-80 max-w-full" />
                </div>

                <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                    {filterSkeletons.map((_, index) => (
                        <div key={index} className="w-full sm:w-72">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="mt-2 h-11 w-full rounded-lg" />
                        </div>
                    ))}
                </div>
            </header>

            <section className="border-border rounded-2xl border p-5 md:flex md:items-center md:justify-between md:gap-6">
                <div className="flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="mt-2 h-8 w-64 max-w-full" />
                    <Skeleton className="mt-2 h-4 w-80 max-w-full" />
                </div>

                <Skeleton className="mt-4 h-11 w-36 rounded-lg md:mt-0" />
            </section>

            <section className="border-border rounded-2xl border p-5 md:p-6">
                <div className="flex items-baseline justify-between gap-4">
                    <Skeleton className="h-7 w-60 max-w-full" />
                    <Skeleton className="h-4 w-20" />
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {metricSkeletons.map((_, index) => (
                        <div key={index}>
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="mt-2 h-9 w-44 max-w-full" />
                            <Skeleton className="mt-2 h-4 w-52 max-w-full" />
                        </div>
                    ))}
                </div>

                <div className="border-border mt-5 border-t pt-4">
                    <Skeleton className="h-4 w-96 max-w-full" />
                    <Skeleton className="mt-2 h-4 w-72 max-w-full" />
                </div>
            </section>

            <section className="space-y-4">
                <div>
                    <Skeleton className="h-8 w-52" />
                    <Skeleton className="mt-2 h-4 w-72 max-w-full" />
                </div>

                <div className="space-y-3">
                    {groupSkeletons.map((_, index) => (
                        <div
                            key={index}
                            className="border-border rounded-2xl border p-4 xl:grid xl:grid-cols-[minmax(12rem,1fr)_minmax(16rem,1.3fr)_10rem] xl:items-center xl:gap-6"
                        >
                            <div>
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="mt-2 h-4 w-48 max-w-full" />
                            </div>

                            <div className="mt-4 space-y-3 xl:mt-0">
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-4/5" />
                            </div>

                            <Skeleton className="mt-4 h-5 w-28 xl:mt-0 xl:ml-auto" />
                        </div>
                    ))}
                </div>
            </section>

            <span className="sr-only">Loading financial summary</span>
        </div>
    );
}

function CurrentPosition({
    groups,
    selected,
    periodLabel,
}: Readonly<{
    groups: DashboardGroupSpend[];
    selected?: DashboardGroupSpend;
    periodLabel: string;
}>) {
    const relevant = selected ? [selected] : groups;

    const receive = relevant.reduce((sum, group) => sum + Math.max(group.currentBalance, 0), 0);

    const pay = relevant.reduce((sum, group) => sum + Math.max(-group.currentBalance, 0), 0);

    return (
        <section
            aria-labelledby="position-heading"
            className="border-border bg-surface rounded-2xl border p-5 md:flex md:items-center md:justify-between md:gap-6"
        >
            <div>
                <p id="position-heading" className="text-muted-foreground text-sm font-medium">
                    Position for {periodLabel.toLocaleLowerCase()}
                </p>

                <div className="font-display mt-1 flex flex-wrap gap-x-6 gap-y-1 text-2xl">
                    <PositionBalance receive={receive} pay={pay} selected={selected} />
                </div>

                <p className="text-muted-foreground mt-1 text-sm">
                    Includes settlement payments recorded in this period.
                </p>
            </div>

            {selected && (
                <Link
                    className="border-border bg-surface hover:bg-muted focus-visible:ring-brand-500 mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none md:mt-0"
                    to={`/groups/${selected.groupId}/balance`}
                >
                    View balances
                    <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
            )}
        </section>
    );
}

function PositionBalance({
    receive,
    pay,
    selected,
}: Readonly<{
    receive: number;
    pay: number;
    selected?: DashboardGroupSpend;
}>) {
    if (receive > 0 && pay > 0) {
        return (
            <>
                <span className="text-owed">To receive {formatCurrency(receive)}</span>

                <span className="text-owe">To pay {formatCurrency(pay)}</span>
            </>
        );
    }

    if (receive > 0) {
        return (
            <span className="text-owed">
                You are owed {formatCurrency(receive)} {selected ? '' : 'overall'}
            </span>
        );
    }

    if (pay > 0) {
        return (
            <span className="text-owe">
                You owe {formatCurrency(pay)} {selected ? '' : 'overall'}
            </span>
        );
    }

    return <span>You are settled up</span>;
}

function SpendingSummary({
    paid,
    share,
    total,
    periodLabel,
}: Readonly<{
    paid: number;
    share: number;
    total?: number;
    periodLabel: string;
}>) {
    return (
        <section
            aria-labelledby="spending-heading"
            className="border-border bg-surface rounded-2xl border p-5 md:p-6"
        >
            <div className="flex items-baseline justify-between gap-4">
                <h2 id="spending-heading" className="font-display text-xl font-semibold">
                    Shared-spending summary
                </h2>

                <span className="text-muted-foreground text-xs">{periodLabel}</span>
            </div>

            <div
                className={`mt-5 grid gap-5 ${
                    total === undefined ? 'sm:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-3'
                }`}
            >
                {total !== undefined && (
                    <Metric
                        label="Total group spending"
                        value={total}
                        help="Settlement transfers excluded."
                    />
                )}

                <Metric
                    label="Paid by you"
                    value={paid}
                    help="Direct payments for shared expenses. Settlements excluded."
                />

                <Metric
                    label="Your share"
                    value={share}
                    help="Your assigned portion of shared expenses."
                />
            </div>

            <div className="border-border mt-5 flex flex-col items-start gap-4 border-t pt-4 text-sm md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="font-medium">{contributionCopy(paid, share)}</p>

                    <p className="text-muted-foreground mt-1">
                        Settlements are excluded from this comparison.
                    </p>
                </div>

                <Link
                    to="/analytics"
                    className="border-border hover:bg-muted focus-visible:ring-brand-500 inline-flex min-h-11 w-full min-w-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none md:w-fit"
                >
                    <BarChart3 aria-hidden="true" className="size-4" />
                    View analytics
                </Link>
            </div>
        </section>
    );
}

function Metric({
    label,
    value,
    help,
}: Readonly<{
    label: string;
    value: number;
    help: string;
}>) {
    return (
        <div>
            <p className="text-muted-foreground text-sm font-medium">{label}</p>

            <p className="font-display mt-1 text-3xl font-semibold tabular-nums">
                {formatCurrency(value)}
            </p>

            <p className="text-muted-foreground mt-2 text-xs">{help}</p>
        </div>
    );
}

function GroupBreakdown({
    groups,
}: Readonly<{
    groups: DashboardGroupSpend[];
}>) {
    const [showAll, setShowAll] = useState(false);

    const visible = showAll ? groups : groups.slice(0, 6);
    const compareWithBars = groups.length > 1;

    return (
        <section aria-labelledby="groups-heading" className="space-y-4">
            <div>
                <h2 id="groups-heading" className="font-display text-2xl font-semibold">
                    Spending by group
                </h2>

                <p className="text-muted-foreground text-sm">
                    Compare what you paid with your assigned share.
                </p>
            </div>

            <div className="space-y-3">
                {visible.map((group) => (
                    <Link
                        key={group.groupId}
                        to={`/groups/${group.groupId}`}
                        className="border-border bg-surface hover:border-brand-400 focus-visible:ring-brand-500 block cursor-pointer rounded-2xl border p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none xl:grid xl:grid-cols-[minmax(12rem,1fr)_minmax(16rem,1.3fr)_10rem] xl:items-center xl:gap-6"
                    >
                        <div className="min-w-0">
                            <h3 className="truncate font-semibold" title={group.name}>
                                {group.name}
                            </h3>

                            <p className="text-muted-foreground mt-1 text-sm">
                                Total group spending{' '}
                                <span className="text-surface-foreground font-medium tabular-nums">
                                    {formatCurrency(group.amount)}
                                </span>
                            </p>
                        </div>

                        <GroupContribution group={group} compareWithBars={compareWithBars} />

                        <div className="border-border mt-4 border-t pt-3 text-sm xl:mt-0 xl:border-0 xl:pt-0 xl:text-right">
                            <BalanceText value={group.currentBalance} />
                        </div>
                    </Link>
                ))}
            </div>

            {groups.length > 6 && (
                <button
                    type="button"
                    onClick={() => setShowAll((value) => !value)}
                    className="focus-visible:ring-brand-500 min-h-11 cursor-pointer rounded-lg px-3 text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none"
                >
                    {showAll ? 'Show fewer groups' : `View all ${groups.length} groups`}
                </button>
            )}
        </section>
    );
}

function GroupContribution({
    group,
    compareWithBars,
}: Readonly<{
    group: DashboardGroupSpend;
    compareWithBars: boolean;
}>) {
    const scale = comparisonScale(group.actualPaid, group.currentUserShare);

    return (
        <div
            className="mt-4 space-y-2 xl:mt-0"
            role={compareWithBars ? 'img' : undefined}
            aria-label={`${group.name}: paid by you ${formatCurrency(
                group.actualPaid,
            )}; your share ${formatCurrency(group.currentUserShare)}`}
        >
            {compareWithBars ? (
                <>
                    <Bar label="Paid by you" value={group.actualPaid} scale={scale} solid />

                    <Bar label="Your share" value={group.currentUserShare} scale={scale} />
                </>
            ) : (
                <ContributionValues group={group} />
            )}
        </div>
    );
}

function ContributionValues({
    group,
}: Readonly<{
    group: DashboardGroupSpend;
}>) {
    const values = [
        ['Paid by you', group.actualPaid],
        ['Your share', group.currentUserShare],
    ] as const;

    return (
        <dl className="grid grid-cols-2 gap-3 text-sm">
            {values.map(([label, value]) => (
                <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-semibold tabular-nums">{formatCurrency(value)}</dd>
                </div>
            ))}
        </dl>
    );
}

function ProgressBar({
    percentage,
    variant = 'brand',
    className = '',
}: Readonly<{
    percentage: number;
    variant?: 'brand' | 'amber';
    className?: string;
}>) {
    const trackClassName = variant === 'amber' ? 'bg-muted border-border border' : 'bg-muted';

    const fillClassName = variant === 'amber' ? 'bg-amber-300 dark:bg-amber-700' : 'bg-brand-600';

    return (
        <span className={`h-2.5 overflow-hidden rounded-full ${trackClassName} ${className}`}>
            <span
                className={`block h-full rounded-full ${fillClassName}`}
                style={{ width: `${percentage}%` }}
            />
        </span>
    );
}

function Bar({
    label,
    value,
    scale,
    solid = false,
}: Readonly<{
    label: string;
    value: number;
    scale: number;
    solid?: boolean;
}>) {
    const percentage = Math.max((value / scale) * 100, value > 0 ? 2 : 0);

    return (
        <div className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-2 text-xs">
            <span className="text-muted-foreground">{label}</span>

            <ProgressBar percentage={percentage} variant={solid ? 'brand' : 'amber'} />

            <span className="min-w-20 text-right font-medium tabular-nums">
                {formatCurrency(value)}
            </span>
        </div>
    );
}

function Participants({
    group,
}: Readonly<{
    group: DashboardGroupSpend;
}>) {
    const [showAll, setShowAll] = useState(false);

    const participants = showAll ? group.memberShares : group.memberShares.slice(0, 8);

    const max = Math.max(...group.memberShares.map((member) => member.amount), 1);

    if (group.amount === 0) {
        return null;
    }

    return (
        <section aria-labelledby="participants-heading">
            <div>
                <h2 id="participants-heading" className="font-display text-2xl font-semibold">
                    Participant shares
                </h2>

                <p className="text-muted-foreground text-sm">
                    Assigned portions of this group's recorded expenses.
                </p>
            </div>

            <ol className="border-border bg-surface mt-4 divide-y rounded-2xl border">
                {participants.map((member, index) => {
                    const percent = group.amount === 0 ? 0 : (member.amount / group.amount) * 100;

                    const width = Math.max((member.amount / max) * 100, member.amount > 0 ? 2 : 0);

                    return (
                        <li key={member.userId} className="p-4">
                            <div className="flex items-center gap-3">
                                <span className="text-muted-foreground w-5 text-sm tabular-nums">
                                    {index + 1}
                                </span>

                                <span aria-label={`${member.name} avatar`}>
                                    <Avatar name={member.name} />
                                </span>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline justify-between gap-3">
                                        <span className="truncate font-medium" title={member.name}>
                                            {member.isCurrentUser
                                                ? `${member.name} (You)`
                                                : member.name}
                                        </span>

                                        <span className="shrink-0 font-semibold tabular-nums">
                                            {formatCurrency(member.amount)}
                                        </span>
                                    </div>

                                    <div className="mt-2 flex items-center gap-3">
                                        <ProgressBar percentage={width} className="flex-1" />

                                        <span className="text-muted-foreground w-14 text-right text-xs tabular-nums">
                                            {percent.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ol>

            {group.memberShares.length > 8 && (
                <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="focus-visible:ring-brand-500 mt-3 min-h-11 cursor-pointer rounded-lg px-3 text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none"
                >
                    Show all {group.memberShares.length} participants
                </button>
            )}
        </section>
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

    const monthlyData = combineMonthlySpending(groups);

    return <SpendingTrendChart data={monthlyData} granularity="month" />;
}

function NoSpendingState({
    description,
    link,
    linkLabel,
}: Readonly<{
    description: string;
    link?: string;
    linkLabel?: string;
}>) {
    return (
        <section className="border-border bg-muted/40 rounded-2xl border p-6">
            <h2 className="font-display text-xl">No spending in this period</h2>

            <p className="text-muted-foreground mt-1 text-sm">{description}</p>

            {link && linkLabel && (
                <Link
                    to={link}
                    className="text-brand-600 mt-3 inline-flex min-h-11 cursor-pointer items-center font-semibold"
                >
                    {linkLabel}
                    <ArrowRight className="ml-2 size-4" />
                </Link>
            )}
        </section>
    );
}

function EmptyDashboard() {
    return (
        <section className="border-border bg-muted/40 rounded-2xl border p-8 text-center">
            <h2 className="font-display text-2xl">No shared spending yet</h2>

            <p className="text-muted-foreground mx-auto mt-2 max-w-lg text-sm">
                Create a group and record your first shared expense. Your payment, share, and
                balances will appear here.
            </p>

            <Link
                to="/groups"
                className="bg-brand-600 hover:bg-brand-700 mt-5 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white"
            >
                <Plus className="size-4" />
                Create a group
            </Link>
        </section>
    );
}

function DashboardError({
    onRetry,
}: Readonly<{
    onRetry: () => void;
}>) {
    return (
        <div className="border-border mx-auto max-w-xl rounded-2xl border p-8 text-center">
            <h1 className="font-display text-2xl">We couldn't load your dashboard</h1>

            <p className="text-muted-foreground mt-2 text-sm">
                Your expenses have not been changed. Try loading the summary again.
            </p>

            <button
                type="button"
                onClick={onRetry}
                className="bg-brand-600 hover:bg-brand-700 focus-visible:ring-brand-500 mt-5 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
                <RefreshCw className="size-4" />
                Retry
            </button>
        </div>
    );
}

export function DashboardPage() {
    const [period, setPeriod] = useState(() => presetPeriod('this-month'));

    const { data, isLoading, isError, refetch } = useDashboard(period.range);

    const [scopeGroupId, setScopeGroupId] = useState<string | null>(null);

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    if (isError || !data) {
        return <DashboardError onRetry={() => void refetch()} />;
    }

    const selected =
        data.groupSpend.find((group) => group.groupId === scopeGroupId) ??
        (data.groupSpend.length === 1 ? data.groupSpend[0] : undefined);

    const hasExpenses = data.groupSpend.some((group) => group.amount > 0);

    const dailyTrend = usesDailyTrend(period);

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <header className="flex flex-col gap-4">
                <div>
                    <h1 className="font-display text-3xl font-semibold">Spending overview</h1>

                    <p className="text-muted-foreground mt-1">
                        Your shared spending and balances across groups
                    </p>
                </div>

                <div className="flex w-full flex-col gap-3 sm:flex-row">
                    <DashboardTimeFilter period={period} onChange={setPeriod} />

                    {data.groupSpend.length > 1 && (
                        <GroupScopeSelector
                            scope="dashboard"
                            groups={data.groupSpend}
                            value={scopeGroupId}
                            onChange={setScopeGroupId}
                        />
                    )}
                </div>
            </header>

            {data.groupSpend.length === 0 ? (
                <EmptyDashboard />
            ) : selected ? (
                <>
                    <CurrentPosition
                        groups={data.groupSpend}
                        selected={selected}
                        periodLabel={period.label}
                    />

                    {selected.amount > 0 ? (
                        <>
                            <SpendingSummary
                                paid={selected.actualPaid}
                                share={selected.currentUserShare}
                                total={selected.amount}
                                periodLabel={period.label}
                            />

                            <TrendChart
                                groups={data.groupSpend}
                                selected={selected}
                                dailyTrend={dailyTrend}
                            />
                        </>
                    ) : (
                        <NoSpendingState
                            description="Try another time period or add an expense to this group."
                            link={`/groups/${selected.groupId}/expenses/new`}
                            linkLabel="Add expense"
                        />
                    )}

                    <Participants group={selected} />
                </>
            ) : (
                <>
                    <CurrentPosition groups={data.groupSpend} periodLabel={period.label} />

                    <SpendingSummary
                        paid={data.actualPaid}
                        share={data.currentUserShare}
                        periodLabel={period.label}
                    />

                    <TrendChart groups={data.groupSpend} dailyTrend={dailyTrend} />

                    {hasExpenses ? (
                        <GroupBreakdown groups={data.groupSpend} />
                    ) : (
                        <NoSpendingState
                            description="Try another time period or add an expense to a group."
                            link={
                                data.groupSpend[0]
                                    ? `/groups/${data.groupSpend[0].groupId}`
                                    : undefined
                            }
                            linkLabel="Open group"
                        />
                    )}
                </>
            )}
        </div>
    );
}
