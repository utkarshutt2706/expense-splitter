import {
    ArrowRight,
    HandCoins,
    PieChart,
    ReceiptIndianRupee,
    Sparkles,
    UsersRound,
    WalletCards,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link } from 'react-router';

import type { DashboardMemberShare } from '@features/dashboard/api/dashboardApi';
import { useDashboard } from '@features/dashboard/hooks';
import { Skeleton } from '@shared/components';

const CHART_COLORS = [
    'stroke-brand-500',
    'stroke-amber-300',
    'stroke-orange-700',
    'stroke-rose-400',
    'stroke-yellow-500',
    'stroke-stone-400',
];

const DOT_COLORS = [
    'bg-brand-500',
    'bg-amber-300',
    'bg-orange-700',
    'bg-rose-400',
    'bg-yellow-500',
    'bg-stone-400',
];

function formatMoney(value: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(value);
}

function SummaryCard({
    icon,
    label,
    value,
    supportingText,
}: Readonly<{
    icon: ReactNode;
    label: string;
    value: number;
    supportingText: string;
}>) {
    return (
        <article className="border-border bg-surface relative overflow-hidden rounded-2xl border p-5 shadow-sm">
            <div className="bg-brand-50 dark:bg-brand-950/40 absolute -top-8 -right-8 size-28 rounded-full" />
            <div className="relative">
                <span className="bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 mb-5 inline-flex size-10 items-center justify-center rounded-xl">
                    {icon}
                </span>
                <p className="text-muted-foreground text-sm font-medium">{label}</p>
                <p className="font-display mt-1 text-3xl font-semibold tracking-tight tabular-nums">
                    {formatMoney(value)}
                </p>
                <p className="text-muted-foreground mt-2 text-xs">{supportingText}</p>
            </div>
        </article>
    );
}

function ShareDonut({
    shares,
    accessibleLabel,
}: Readonly<{ shares: DashboardMemberShare[]; accessibleLabel: string }>) {
    const total = shares.reduce((sum, share) => sum + share.amount, 0);
    const percentages = shares.map((share) => (total === 0 ? 0 : (share.amount / total) * 100));

    return (
        <div className="grid items-center gap-6 sm:grid-cols-[minmax(180px,0.8fr)_1.2fr]">
            <div className="relative mx-auto size-48" role="img" aria-label={accessibleLabel}>
                <svg viewBox="0 0 42 42" className="size-full -rotate-90" aria-hidden="true">
                    <circle
                        cx="21"
                        cy="21"
                        r="15.915"
                        fill="none"
                        className="stroke-muted"
                        strokeWidth="6"
                    />
                    {shares.map((share, index) => {
                        const percentage = percentages[index] ?? 0;
                        const offset = percentages
                            .slice(0, index)
                            .reduce((sum, value) => sum + value, 0);
                        return (
                            <circle
                                key={share.userId}
                                cx="21"
                                cy="21"
                                r="15.915"
                                fill="none"
                                pathLength="100"
                                strokeDasharray={`${percentage} ${100 - percentage}`}
                                strokeDashoffset={-offset}
                                strokeWidth="6"
                                className={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-muted-foreground text-xs">Total spend</span>
                    <strong className="font-display text-lg">{formatMoney(total)}</strong>
                </div>
            </div>
            <ul className="space-y-3">
                {shares.map((share, index) => (
                    <li key={share.userId} className="flex items-center gap-3 text-sm">
                        <span
                            className={`size-2.5 shrink-0 rounded-full ${DOT_COLORS[index % DOT_COLORS.length]}`}
                        />
                        <span className="min-w-0 flex-1 truncate">
                            {share.isCurrentUser ? 'You' : share.name}
                        </span>
                        <span className="font-medium tabular-nums">
                            {formatMoney(share.amount)}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div role="status" aria-label="Loading dashboard" className="space-y-6">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-48 rounded-2xl" />
                <Skeleton className="h-48 rounded-2xl" />
                <Skeleton className="h-48 rounded-2xl" />
                <Skeleton className="h-48 rounded-2xl" />
            </div>
            <Skeleton className="h-80 rounded-2xl" />
        </div>
    );
}

export function DashboardPage() {
    const { data, isLoading, isError } = useDashboard();
    const [selectedGroupId, setSelectedGroupId] = useState('');

    if (isLoading) return <DashboardSkeleton />;
    if (isError || !data) {
        return (
            <div className="border-border rounded-2xl border p-8 text-center">
                <p className="font-display text-xl">We couldn't load your dashboard</p>
                <p className="text-muted-foreground mt-1 text-sm">Refresh the page to try again.</p>
            </div>
        );
    }

    const hasActivity = data.memberShares.length > 0;
    const largestGroupAmount = data.groupSpend[0]?.amount ?? 0;
    const selectedGroup =
        data.groupSpend.find((group) => group.groupId === selectedGroupId) ?? data.groupSpend[0];

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <section className="from-brand-700 to-brand-500 shadow-brand-900/10 relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-lg md:p-8">
                <div className="absolute -top-16 -right-8 size-52 rounded-full border border-white/15" />
                <div className="absolute -right-16 -bottom-28 size-64 rounded-full bg-white/10" />
                <div className="relative max-w-2xl">
                    <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                        <Sparkles className="size-3.5" /> Your money story
                    </span>
                    <h1 className="font-display text-3xl font-semibold md:text-4xl">
                        Shared spending, at a glance.
                    </h1>
                    <p className="mt-2 max-w-xl text-sm text-white/80 md:text-base">
                        See what you actually paid and how every person's fair share adds up across
                        your groups.
                    </p>
                </div>
            </section>

            {!hasActivity ? (
                <section className="border-border bg-muted/40 rounded-2xl border p-10 text-center">
                    <ReceiptIndianRupee className="text-brand-500 mx-auto size-10" />
                    <h2 className="font-display mt-4 text-2xl">Your dashboard is ready</h2>
                    <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
                        Add an expense to a group and your spending insights will appear here.
                    </p>
                    <Link
                        to="/groups"
                        className="bg-brand-600 hover:bg-brand-700 mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
                    >
                        View groups <ArrowRight className="size-4" />
                    </Link>
                </section>
            ) : (
                <>
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard
                            icon={<WalletCards className="size-5" />}
                            label="Actually paid by you"
                            value={data.actualPaid}
                            supportingText="Money you directly paid toward shared expenses"
                        />
                        <SummaryCard
                            icon={<PieChart className="size-5" />}
                            label="Your fair share"
                            value={data.currentUserShare}
                            supportingText="Your portion across every shared expense"
                        />
                        <SummaryCard
                            icon={<HandCoins className="size-5" />}
                            label={`Paid by you in ${selectedGroup?.name ?? 'this group'}`}
                            value={selectedGroup?.actualPaid ?? 0}
                            supportingText="Money you directly paid in the selected group"
                        />
                        <SummaryCard
                            icon={<UsersRound className="size-5" />}
                            label={`Your share in ${selectedGroup?.name ?? 'this group'}`}
                            value={selectedGroup?.currentUserShare ?? 0}
                            supportingText="Your portion of the selected group's expenses"
                        />
                    </section>

                    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                        <article className="border-border rounded-2xl border p-5 md:p-6">
                            <div className="mb-6">
                                <p className="text-brand-600 text-xs font-semibold tracking-wider uppercase">
                                    People
                                </p>
                                <h2 className="font-display mt-1 text-2xl font-semibold">
                                    {selectedGroup?.name} shares
                                </h2>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    A per-person view of the selected group's expenses.
                                </p>
                            </div>
                            {selectedGroup && (
                                <ShareDonut
                                    shares={selectedGroup.memberShares}
                                    accessibleLabel={`Per-person share chart for ${selectedGroup.name}`}
                                />
                            )}
                        </article>

                        <article className="border-border rounded-2xl border p-5 md:p-6">
                            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <p className="text-brand-600 text-xs font-semibold tracking-wider uppercase">
                                        Groups
                                    </p>
                                    <h2 className="font-display mt-1 text-2xl font-semibold">
                                        Spend by group
                                    </h2>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        Where your shared expenses are concentrated.
                                    </p>
                                </div>
                                <label className="text-muted-foreground text-xs font-medium">
                                    Group details
                                    <select
                                        value={selectedGroup?.groupId ?? ''}
                                        onChange={(event) => setSelectedGroupId(event.target.value)}
                                        className="border-border bg-surface text-surface-foreground mt-1 block max-w-48 rounded-lg border px-3 py-2 text-sm"
                                    >
                                        {data.groupSpend.map((group) => (
                                            <option key={group.groupId} value={group.groupId}>
                                                {group.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            <ul className="space-y-5">
                                {data.groupSpend.map((group) => (
                                    <li key={group.groupId}>
                                        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                                            <Link
                                                to={`/groups/${group.groupId}`}
                                                className="hover:text-brand-600 truncate font-medium"
                                            >
                                                {group.name}
                                            </Link>
                                            <span className="shrink-0 tabular-nums">
                                                {formatMoney(group.amount)}
                                            </span>
                                        </div>
                                        <div className="bg-muted h-2 overflow-hidden rounded-full">
                                            <div
                                                className="from-brand-600 to-brand-300 h-full rounded-full bg-gradient-to-r"
                                                style={{
                                                    width: `${largestGroupAmount === 0 ? 0 : Math.max((group.amount / largestGroupAmount) * 100, 3)}%`,
                                                }}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </article>
                    </section>
                </>
            )}
        </div>
    );
}
