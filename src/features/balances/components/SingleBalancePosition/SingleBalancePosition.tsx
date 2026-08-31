export type SingleBalancePositionProps = Readonly<{
    text: string;
    count: number;
    suffix: string;
    tone: 'pay' | 'receive';
}>;

export function SingleBalancePosition({ text, count, suffix, tone }: SingleBalancePositionProps) {
    return (
        <>
            <p
                className={
                    tone === 'receive'
                        ? 'text-owed text-lg font-semibold'
                        : 'text-owe text-lg font-semibold'
                }
            >
                {text}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
                {count} {count === 1 ? 'payment' : 'payments'} {suffix}
            </p>
        </>
    );
}
