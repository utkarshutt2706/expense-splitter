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

// Chart axes have a fixed gutter, and en-IN grouping makes large amounts long
// enough to be clipped there (₹1,05,000.00 needs roughly twice the width of
// ₹0.00). Compact notation keeps a tick to a few characters using the lakh and
// crore scale readers here expect, while tooltips and tables keep full
// precision.
const compactInrFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    currencyDisplay: 'narrowSymbol',
    notation: 'compact',
    maximumFractionDigits: 1,
});

export function formatCompactCurrency(value: unknown): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
    return compactInrFormatter.format(Object.is(value, -0) ? 0 : value);
}
