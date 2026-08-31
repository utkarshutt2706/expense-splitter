import { formatCurrency } from '@shared/utils';

export type BalancePositionValueProps = Readonly<{
    label: string;
    amount: number;
    tone: 'pay' | 'receive';
}>;

export function BalancePositionValue({ label, amount, tone }: BalancePositionValueProps) {
    return (
        <div>
            <p className="text-muted-foreground text-sm">{label}</p>
            <p
                className={
                    tone === 'receive' ? 'text-owed font-semibold' : 'text-owe font-semibold'
                }
            >
                {formatCurrency(amount)}
            </p>
        </div>
    );
}
