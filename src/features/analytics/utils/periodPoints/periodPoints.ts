import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import {
    combineDailySpending,
    combineMonthlySpending,
    monthLabel,
    shortDayLabel,
} from '@features/dashboard/utils';

export interface PeriodPoint {
    label: string;
    amount: number;
    actualPaid: number;
    currentUserShare: number;
}

export function periodPoints(
    groups: DashboardGroupSpend[],
    dailyTrend: boolean,
): { daily: boolean; points: PeriodPoint[] } {
    const daily = dailyTrend && groups.every((group) => group.spendingByDay !== undefined);
    const points = daily
        ? combineDailySpending(groups).map((entry) => ({
              ...entry,
              label: shortDayLabel(entry.date),
          }))
        : combineMonthlySpending(groups).map((entry) => ({
              ...entry,
              label: monthLabel(entry.month),
          }));
    return { daily, points };
}
