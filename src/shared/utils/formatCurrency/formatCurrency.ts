const inrFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export function formatCurrency(value: unknown): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
    return inrFormatter.format(Object.is(value, -0) ? 0 : value);
}
