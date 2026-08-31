import { formatCurrency } from '@shared/utils';

export type BalanceTextProps = Readonly<{ value: number; short?: boolean }>;

export function BalanceText({ value, short = false }: BalanceTextProps) {
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
