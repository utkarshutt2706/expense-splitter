import { formatCurrency } from '@shared/utils';

export type MetricProps = Readonly<{ label: string; value: number; help: string }>;

export function Metric({ label, value, help }: MetricProps) {
    return (
        <div>
            <p className="text-muted-foreground text-sm font-medium">{label}</p>
            <p className="mt-1 text-3xl font-semibold">{formatCurrency(value)}</p>
            <p className="text-muted-foreground mt-2 text-xs">{help}</p>
        </div>
    );
}
