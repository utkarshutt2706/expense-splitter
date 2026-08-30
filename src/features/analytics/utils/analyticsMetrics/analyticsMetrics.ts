const round = (value: number) => Math.round(value * 100) / 100;

export interface ContributionBalance {
    /** Paid beyond your share — the group owes this back to you. */
    owed: number;
    /** Share beyond what you paid — still to pay in. */
    owe: number;
}

/**
 * Which way a group's paid/share pair leans, and by how much. Only one side is
 * ever non-zero; both zero means the two are level.
 */
export function contributionBalance(paid: number, share: number): ContributionBalance {
    const difference = round(Math.max(paid, 0) - Math.max(share, 0));

    return {
        owed: Math.max(difference, 0),
        owe: difference < 0 ? Math.abs(difference) : 0,
    };
}

export interface NetPositionPoint<T> {
    entry: T;
    /** paid - share for this bucket alone. */
    net: number;
    /** Running total of net, i.e. the position carried into the next bucket. */
    cumulative: number;
}

/**
 * Running total of what you fronted minus what you owed, bucket by bucket.
 * Above zero you have been carrying the group; below it you have been carried.
 */
export function cumulativeNetPosition<T extends { actualPaid: number; currentUserShare: number }>(
    entries: readonly T[],
): NetPositionPoint<T>[] {
    let running = 0;

    return entries.map((entry) => {
        const net = round(entry.actualPaid - entry.currentUserShare);
        running = round(running + net);
        return { entry, net, cumulative: running };
    });
}

export interface BucketedGroupSpending {
    /** Raw bucket key: 'YYYY-MM' for months, 'YYYY-MM-DD' for days. */
    bucket: string;
    /** Amount per group id. Every group present in the input gets an entry, so
     *  a group with nothing in a bucket still plots a zero rather than shifting
     *  the other bars along. */
    amounts: Record<string, number>;
}

interface BucketableGroup {
    groupId: string;
    spendingByMonth: { month: string; amount: number }[];
    spendingByDay?: { date: string; amount: number }[];
}

/**
 * Turns "each group has its own series" into "each bucket has a value per
 * group", which is the shape a clustered bar chart needs. Buckets are the union
 * across groups, sorted; keys sort chronologically as plain strings because
 * both formats are zero-padded and big-endian.
 */
export function bucketGroupSpending(
    groups: readonly BucketableGroup[],
    granularity: 'day' | 'month',
): BucketedGroupSpending[] {
    const buckets = new Map<string, Record<string, number>>();
    const blank = Object.fromEntries(groups.map((group) => [group.groupId, 0]));

    for (const group of groups) {
        const entries =
            granularity === 'day'
                ? (group.spendingByDay ?? []).map((entry) => [entry.date, entry.amount] as const)
                : group.spendingByMonth.map((entry) => [entry.month, entry.amount] as const);

        for (const [key, amount] of entries) {
            const row = buckets.get(key) ?? { ...blank };
            row[group.groupId] = round((row[group.groupId] ?? 0) + amount);
            buckets.set(key, row);
        }
    }

    return [...buckets.entries()]
        .map(([bucket, amounts]) => ({ bucket, amounts }))
        .sort((left, right) => left.bucket.localeCompare(right.bucket));
}

/**
 * Round tick values covering 0..max, so a pinned axis and the plot that scrolls
 * beside it can be handed an identical scale. Recharts picks its own ticks per
 * chart otherwise, and two charts would disagree.
 *
 * The step is the smallest of 1, 2, 2.5 or 5 times a power of ten that still
 * spans the range in `count` steps, which is what keeps labels readable
 * (₹20K, ₹40K) instead of arbitrary (₹32.5K).
 */
export function niceTicks(max: number, count = 4): number[] {
    if (!Number.isFinite(max) || max <= 0) return [0];

    const magnitude = 10 ** Math.floor(Math.log10(max / count));
    const step =
        ([1, 2, 2.5, 5, 10].find((factor) => magnitude * factor >= max / count) ?? 10) * magnitude;
    const top = Math.ceil(max / step) * step;

    const ticks: number[] = [];
    for (let value = 0; value <= top + step / 2; value += step) {
        ticks.push(round(value));
    }
    return ticks;
}
