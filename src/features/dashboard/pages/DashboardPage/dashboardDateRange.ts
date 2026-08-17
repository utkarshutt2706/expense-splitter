export type DashboardPeriodPreset =
    'this-month' | 'previous-month' | 'last-three-months' | 'this-year' | 'custom';

export interface DashboardDateRange {
    from: string;
    to: string;
}

export interface DashboardPeriod {
    preset: DashboardPeriodPreset;
    label: string;
    range: DashboardDateRange;
}

const LABELS: Record<DashboardPeriodPreset, string> = {
    'this-month': 'This month',
    'previous-month': 'Previous month',
    'last-three-months': 'Last 3 months',
    'this-year': 'This year',
    custom: 'Custom date range',
};

function localMidnight(year: number, month: number, day: number): Date {
    return new Date(year, month, day, 0, 0, 0, 0);
}

export function presetPeriod(
    preset: Exclude<DashboardPeriodPreset, 'custom'>,
    now = new Date(),
): DashboardPeriod {
    const year = now.getFullYear();
    const month = now.getMonth();
    let start: Date;
    let end: Date;
    if (preset === 'previous-month') {
        start = localMidnight(year, month - 1, 1);
        end = localMidnight(year, month, 1);
    } else if (preset === 'last-three-months') {
        start = localMidnight(year, month - 2, 1);
        end = localMidnight(year, month + 1, 1);
    } else if (preset === 'this-year') {
        start = localMidnight(year, 0, 1);
        end = localMidnight(year + 1, 0, 1);
    } else {
        start = localMidnight(year, month, 1);
        end = localMidnight(year, month + 1, 1);
    }
    return {
        preset,
        label: LABELS[preset],
        range: { from: start.toISOString(), to: end.toISOString() },
    };
}

export function dateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function customPeriod(
    startValue: string,
    endValue: string,
    now = new Date(),
): DashboardPeriod {
    const start = new Date(`${startValue}T00:00:00`);
    const inclusiveEnd = new Date(`${endValue}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(inclusiveEnd.getTime())) {
        throw new Error('Choose a start and end date.');
    }
    if (start > inclusiveEnd) throw new Error('Start date must be on or before end date.');
    const end = new Date(inclusiveEnd);
    end.setDate(end.getDate() + 1);
    const maximumEnd = new Date(start);
    maximumEnd.setFullYear(maximumEnd.getFullYear() + 1);
    if (end > maximumEnd) throw new Error('Custom date range cannot exceed one year.');
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (start > today || inclusiveEnd > today) {
        throw new Error('Custom dates cannot be after today.');
    }
    return {
        preset: 'custom',
        label: `${start.toLocaleDateString()} – ${inclusiveEnd.toLocaleDateString()}`,
        range: { from: start.toISOString(), to: end.toISOString() },
    };
}

export function periodLabel(preset: DashboardPeriodPreset): string {
    return LABELS[preset];
}
