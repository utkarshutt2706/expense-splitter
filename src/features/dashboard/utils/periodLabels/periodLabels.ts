// Shared by the spending trend and the analytics net-position chart so both
// axes read identically. Dates arrive as plain ISO strings and are formatted in
// UTC, so a bucket never shifts a day either side of midnight.

export function monthLabel(month: string): string {
    return new Intl.DateTimeFormat('en-IN', {
        month: 'short',
        year: '2-digit',
        timeZone: 'UTC',
    }).format(new Date(`${month}-01T00:00:00Z`));
}

export function dayLabel(date: string): string {
    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`));
}

/** Day without the year, for axes where every tick shares the same range. */
export function shortDayLabel(date: string): string {
    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`));
}
