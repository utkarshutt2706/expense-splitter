export type ProgressBarProps = Readonly<{
    percentage: number;
    variant?: 'brand' | 'amber';
    className?: string;
}>;

export function ProgressBar({ percentage, variant = 'brand', className = '' }: ProgressBarProps) {
    const trackClassName = variant === 'amber' ? 'bg-muted border-border border' : 'bg-muted';
    const fillClassName = variant === 'amber' ? 'bg-amber-300 dark:bg-amber-700' : 'bg-brand-600';
    return (
        <span className={`h-2.5 overflow-hidden rounded-full ${trackClassName} ${className}`}>
            <span
                className={`block h-full rounded-full ${fillClassName}`}
                style={{ width: `${percentage}%` }}
            />
        </span>
    );
}
