import { BarChart3 } from 'lucide-react';
import { Link } from 'react-router';

import { Metric } from '@features/dashboard/components/Metric';
import { contributionCopy } from '@features/dashboard/utils';

export type SpendingSummaryProps = Readonly<{
    paid: number;
    share: number;
    total?: number;
    periodLabel: string;
}>;

export function SpendingSummary({ paid, share, total, periodLabel }: SpendingSummaryProps) {
    return (
        <section
            aria-labelledby="spending-heading"
            className="border-border bg-surface rounded-2xl border p-5 md:p-6"
        >
            <div className="flex items-baseline justify-between gap-4">
                <h2 id="spending-heading" className="text-xl font-semibold">
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
