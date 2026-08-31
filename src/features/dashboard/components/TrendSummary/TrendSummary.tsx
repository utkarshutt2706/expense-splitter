import type { TrendEntry } from '@features/dashboard/components/PeriodSelector';
import { formatCurrency } from '@shared/utils';

const SUMMARY_LABELS = [
    ['Total group spending', 'amount'],
    ['Your share', 'currentUserShare'],
    ['Paid by you', 'actualPaid'],
] as const;

export type TrendSummaryProps = Readonly<{ selected: TrendEntry }>;

export function TrendSummary({ selected }: TrendSummaryProps) {
    return (
        <dl className="w-full space-y-2 text-sm" aria-live="polite">
            {SUMMARY_LABELS.map(([label, key]) => (
                <div key={key} className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="shrink-0 font-semibold">{formatCurrency(selected[key])}</dd>
                </div>
            ))}
        </dl>
    );
}
