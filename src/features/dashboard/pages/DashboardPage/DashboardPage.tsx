import * as Popover from '@radix-ui/react-popover';
import { ArrowRight, Check, ChevronDown, Plus, RefreshCw, Search } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router';

import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { useDashboard } from '@features/dashboard/hooks';
import { Avatar, Skeleton } from '@shared/components';
import {
    combineDailySpending,
    combineMonthlySpending,
    comparisonScale,
    contributionCopy,
    formatMoney,
} from './dashboardMetrics';
import { SpendingTrendChart } from './SpendingTrendChart';
import { presetPeriod, usesDailyTrend } from './dashboardDateRange';
import { DashboardTimeFilter } from './DashboardTimeFilter';

function BalanceText({ value, short = false }: Readonly<{ value: number; short?: boolean }>) {
    if (value > 0)
        return (
            <span className="text-owed font-semibold">
                {short ? 'Owed' : 'You are owed'} {formatMoney(value)}
            </span>
        );
    if (value < 0)
        return (
            <span className="text-owe font-semibold">
                {short ? 'Owe' : 'You owe'} {formatMoney(value)}
            </span>
        );
    return <span className="text-muted-foreground font-semibold">Settled up</span>;
}

function DashboardSkeleton() {
    return (
        <div role="status" aria-label="Loading dashboard" className="mx-auto max-w-7xl space-y-6">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-52 rounded-2xl" />
            <span className="sr-only">Loading financial summary</span>
        </div>
    );
}

function GroupScopeSelector({
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
        <div className="w-full text-sm font-medium sm:w-72">
            <span id="dashboard-scope-label">View:</span>
            <Popover.Root
                open={open}
                onOpenChange={(nextOpen) => {
                    setOpen(nextOpen);
                    if (!nextOpen) setQuery('');
                }}
            >
                <Popover.Trigger asChild>
                    <button
                        type="button"
                        aria-labelledby="dashboard-scope-label dashboard-scope-value"
                        aria-haspopup="dialog"
                        aria-expanded={open}
                        className="border-border bg-surface focus-visible:ring-brand-500 mt-1 flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 text-left outline-none focus-visible:ring-2"
                    >
                        <span id="dashboard-scope-value" className="truncate">
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
                        aria-label="Choose dashboard group"
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
                            aria-label="Dashboard scopes"
                        >
                            {!query && (
                                <button
                                    type="button"
                                    onClick={() => select(null)}
                                    className="hover:bg-muted focus-visible:bg-muted flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2 text-left outline-none"
                                >
                                    <span>All groups</span>
                                    {value === null && <Check className="text-brand-600 size-4" />}
                                </button>
                            )}
                            {filteredGroups.map((group) => (
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
                    {receive > 0 && pay > 0 ? (
                        <>
                            <span className="text-owed">To receive {formatMoney(receive)}</span>
                            <span className="text-owe">To pay {formatMoney(pay)}</span>
                        </>
                    ) : receive > 0 ? (
                        <span className="text-owed">
                            You are owed {formatMoney(receive)} {selected ? '' : 'overall'}
                        </span>
                    ) : pay > 0 ? (
                        <span className="text-owe">
                            You owe {formatMoney(pay)} {selected ? '' : 'overall'}
                        </span>
                    ) : (
                        <span>You are settled up</span>
                    )}
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                    Includes settlement payments recorded in this period.
                </p>
            </div>
            {selected && (
                <Link
                    className="focus-visible:ring-brand-500 mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none md:mt-0"
                    to={`/groups/${selected.groupId}/balance`}
                >
                    View balances <ArrowRight className="size-4" />
                </Link>
            )}
        </section>
    );
}

function SpendingSummary({
    paid,
    share,
    total,
    periodLabel,
}: Readonly<{ paid: number; share: number; total?: number; periodLabel: string }>) {
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
                className={`mt-5 grid gap-5 ${total === undefined ? 'sm:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-3'}`}
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
            <div className="border-border mt-5 border-t pt-4 text-sm">
                <p className="font-medium">{contributionCopy(paid, share)}</p>
                <p className="text-muted-foreground mt-1">
                    Settlements are excluded from this comparison.
                </p>
            </div>
        </section>
    );
}

function Metric({ label, value, help }: Readonly<{ label: string; value: number; help: string }>) {
    return (
        <div>
            <p className="text-muted-foreground text-sm font-medium">{label}</p>
            <p className="font-display mt-1 text-3xl font-semibold tabular-nums">
                {formatMoney(value)}
            </p>
            <p className="text-muted-foreground mt-2 text-xs">{help}</p>
        </div>
    );
}

function GroupBreakdown({ groups }: Readonly<{ groups: DashboardGroupSpend[] }>) {
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
                                    {formatMoney(group.amount)}
                                </span>
                            </p>
                        </div>
                        <div
                            className="mt-4 space-y-2 xl:mt-0"
                            role={compareWithBars ? 'img' : undefined}
                            aria-label={`${group.name}: paid by you ${formatMoney(group.actualPaid)}; your share ${formatMoney(group.currentUserShare)}`}
                        >
                            {compareWithBars ? (
                                <>
                                    <Bar
                                        label="Paid by you"
                                        value={group.actualPaid}
                                        scale={comparisonScale(
                                            group.actualPaid,
                                            group.currentUserShare,
                                        )}
                                        solid
                                    />
                                    <Bar
                                        label="Your share"
                                        value={group.currentUserShare}
                                        scale={comparisonScale(
                                            group.actualPaid,
                                            group.currentUserShare,
                                        )}
                                    />
                                </>
                            ) : (
                                <dl className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <dt className="text-muted-foreground">Paid by you</dt>
                                        <dd className="font-semibold tabular-nums">
                                            {formatMoney(group.actualPaid)}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">Your share</dt>
                                        <dd className="font-semibold tabular-nums">
                                            {formatMoney(group.currentUserShare)}
                                        </dd>
                                    </div>
                                </dl>
                            )}
                        </div>
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

function Bar({
    label,
    value,
    scale,
    solid = false,
}: Readonly<{ label: string; value: number; scale: number; solid?: boolean }>) {
    return (
        <div className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-2 text-xs">
            <span className="text-muted-foreground">{label}</span>
            <span
                className={`bg-muted h-2.5 overflow-hidden rounded-full ${solid ? '' : 'border-border border'}`}
            >
                <span
                    className={`block h-full rounded-full ${solid ? 'bg-brand-600' : 'bg-amber-300 dark:bg-amber-700'}`}
                    style={{ width: `${Math.max((value / scale) * 100, value > 0 ? 2 : 0)}%` }}
                />
            </span>
            <span className="min-w-20 text-right font-medium tabular-nums">
                {formatMoney(value)}
            </span>
        </div>
    );
}

function Participants({ group }: Readonly<{ group: DashboardGroupSpend }>) {
    const [showAll, setShowAll] = useState(false);
    const participants = showAll ? group.memberShares : group.memberShares.slice(0, 8);
    const max = Math.max(...group.memberShares.map((member) => member.amount), 1);
    if (group.amount === 0) return null;
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
                    return (
                        <li
                            key={member.userId}
                            className={`p-4 ${member.isCurrentUser ? 'bg-brand-50/70 dark:bg-brand-950/20' : ''}`}
                        >
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
                                            {formatMoney(member.amount)}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-3">
                                        <span className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                                            <span
                                                className={`block h-full rounded-full ${member.isCurrentUser ? 'bg-brand-600' : 'bg-stone-400 dark:bg-stone-500'}`}
                                                style={{
                                                    width: `${Math.max((member.amount / max) * 100, member.amount > 0 ? 2 : 0)}%`,
                                                }}
                                            />
                                        </span>
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

export function DashboardPage() {
    const [period, setPeriod] = useState(() => presetPeriod('this-month'));
    const { data, isLoading, isError, refetch } = useDashboard(period.range);
    const [scopeGroupId, setScopeGroupId] = useState<string | null>(null);
    if (isLoading) return <DashboardSkeleton />;
    if (isError || !data)
        return (
            <div className="border-border mx-auto max-w-xl rounded-2xl border p-8 text-center">
                <h1 className="font-display text-2xl">We couldn't load your dashboard</h1>
                <p className="text-muted-foreground mt-2 text-sm">
                    Your expenses have not been changed. Try loading the summary again.
                </p>
                <button
                    type="button"
                    onClick={() => void refetch()}
                    className="bg-brand-600 hover:bg-brand-700 focus-visible:ring-brand-500 mt-5 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                    <RefreshCw className="size-4" /> Retry
                </button>
            </div>
        );
    const selected =
        data.groupSpend.find((group) => group.groupId === scopeGroupId) ??
        (data.groupSpend.length === 1 ? data.groupSpend[0] : undefined);
    const hasExpenses = data.groupSpend.some((group) => group.amount > 0);
    const dailyTrend = usesDailyTrend(period);
    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="font-display text-3xl font-semibold">Spending overview</h1>
                    <p className="text-muted-foreground mt-1">
                        Your shared spending and balances across groups
                    </p>
                </div>
                <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:items-start">
                    <DashboardTimeFilter period={period} onChange={setPeriod} />
                    {data.groupSpend.length > 1 && (
                        <GroupScopeSelector
                            groups={data.groupSpend}
                            value={scopeGroupId}
                            onChange={setScopeGroupId}
                        />
                    )}
                </div>
            </header>
            {data.groupSpend.length === 0 ? (
                <section className="border-border bg-muted/40 rounded-2xl border p-8 text-center">
                    <h2 className="font-display text-2xl">No shared spending yet</h2>
                    <p className="text-muted-foreground mx-auto mt-2 max-w-lg text-sm">
                        Create a group and record your first shared expense. Your payment, share,
                        and balances will appear here.
                    </p>
                    <Link
                        to="/groups"
                        className="bg-brand-600 hover:bg-brand-700 mt-5 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white"
                    >
                        <Plus className="size-4" /> Create a group
                    </Link>
                </section>
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
                            {dailyTrend ? (
                                <SpendingTrendChart
                                    data={selected.spendingByDay}
                                    granularity="day"
                                />
                            ) : (
                                <SpendingTrendChart
                                    data={selected.spendingByMonth}
                                    granularity="month"
                                />
                            )}
                        </>
                    ) : (
                        <section className="border-border bg-muted/40 rounded-2xl border p-6">
                            <h2 className="font-display text-xl">No spending in this period</h2>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Try another time period or add an expense to this group.
                            </p>
                            <Link
                                to={`/groups/${selected.groupId}/expenses/new`}
                                className="text-brand-600 mt-3 inline-flex min-h-11 cursor-pointer items-center font-semibold"
                            >
                                Add expense <ArrowRight className="ml-2 size-4" />
                            </Link>
                        </section>
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
                    {dailyTrend ? (
                        <SpendingTrendChart
                            data={
                                data.groupSpend.every((group) => group.spendingByDay !== undefined)
                                    ? combineDailySpending(data.groupSpend)
                                    : undefined
                            }
                            granularity="day"
                        />
                    ) : (
                        <SpendingTrendChart
                            data={combineMonthlySpending(data.groupSpend)}
                            granularity="month"
                        />
                    )}
                    {hasExpenses ? (
                        <GroupBreakdown groups={data.groupSpend} />
                    ) : (
                        <section className="border-border bg-muted/40 rounded-2xl border p-6">
                            <h2 className="font-display text-xl">No spending in this period</h2>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Try another time period or add an expense to a group.
                            </p>
                            <Link
                                to={`/groups/${data.groupSpend[0]?.groupId}`}
                                className="text-brand-600 mt-3 inline-flex min-h-11 cursor-pointer items-center font-semibold"
                            >
                                Open group <ArrowRight className="ml-2 size-4" />
                            </Link>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}
