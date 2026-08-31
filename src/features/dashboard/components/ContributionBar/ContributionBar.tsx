import { ProgressBar } from '@features/dashboard/components/ProgressBar';
import { formatCurrency } from '@shared/utils';

export type ContributionBarProps = Readonly<{
    label: string;
    value: number;
    scale: number;
    solid?: boolean;
}>;

export function ContributionBar({ label, value, scale, solid = false }: ContributionBarProps) {
    const percentage = Math.max((value / scale) * 100, value > 0 ? 2 : 0);
    return (
        <div className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-2 text-xs">
            <span className="text-muted-foreground">{label}</span>
            <ProgressBar percentage={percentage} variant={solid ? 'brand' : 'amber'} />
            <span className="min-w-20 text-right font-medium">{formatCurrency(value)}</span>
        </div>
    );
}
