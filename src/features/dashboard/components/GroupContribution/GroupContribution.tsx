import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { ContributionBar } from '@features/dashboard/components/ContributionBar';
import { ContributionValues } from '@features/dashboard/components/ContributionValues';
import { comparisonScale } from '@features/dashboard/utils';
import { formatCurrency } from '@shared/utils';

export type GroupContributionProps = Readonly<{
    group: DashboardGroupSpend;
    compareWithBars: boolean;
}>;

export function GroupContribution({ group, compareWithBars }: GroupContributionProps) {
    const scale = comparisonScale(group.actualPaid, group.currentUserShare);
    return (
        <figure
            className="mt-4 space-y-2 xl:mt-0"
            aria-label={`${group.name}: paid by you ${formatCurrency(group.actualPaid)}; your share ${formatCurrency(group.currentUserShare)}`}
        >
            {compareWithBars ? (
                <>
                    <ContributionBar
                        label="Paid by you"
                        value={group.actualPaid}
                        scale={scale}
                        solid
                    />
                    <ContributionBar
                        label="Your share"
                        value={group.currentUserShare}
                        scale={scale}
                    />
                </>
            ) : (
                <ContributionValues group={group} />
            )}
        </figure>
    );
}
