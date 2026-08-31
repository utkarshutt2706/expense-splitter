import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { formatCurrency } from '@shared/utils';

export type ContributionValuesProps = Readonly<{ group: DashboardGroupSpend }>;

export function ContributionValues({ group }: ContributionValuesProps) {
    const values = [
        ['Paid by you', group.actualPaid],
        ['Your share', group.currentUserShare],
    ] as const;
    return (
        <dl className="grid grid-cols-2 gap-3 text-sm">
            {values.map(([label, value]) => (
                <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-semibold">{formatCurrency(value)}</dd>
                </div>
            ))}
        </dl>
    );
}
