import { contributionBalance, contributionBalanceLabel } from '@features/analytics/utils';
import { formatCurrency } from '@shared/utils';

export interface ContributionDatum {
    name: string;
    paid: number;
    share: number;
}
export type ContributionTooltipProps = Readonly<{
    active?: boolean;
    label?: string;
    payload?: { payload?: ContributionDatum }[];
}>;

export function ContributionTooltip({ active, label, payload }: ContributionTooltipProps) {
    const datum = payload?.[0]?.payload;
    if (!active || !datum) return null;
    const { owed, owe } = contributionBalance(datum.paid, datum.share);
    return (
        <div className="border-border bg-surface text-surface-foreground min-w-44 rounded-xl border px-3 py-2 text-xs shadow-lg">
            <p className="font-semibold">{label}</p>
            <dl className="mt-1 space-y-0.5">
                <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Paid by you</dt>
                    <dd>{formatCurrency(datum.paid)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Your share</dt>
                    <dd>{formatCurrency(datum.share)}</dd>
                </div>
            </dl>
            <p className="text-muted-foreground mt-1.5 font-semibold">
                {contributionBalanceLabel(owed, owe)}
            </p>
        </div>
    );
}
