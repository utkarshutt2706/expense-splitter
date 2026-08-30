import { httpClient } from '@lib/api/httpClient';
import type {
    DashboardContract,
    DashboardDailySpendContract,
    DashboardGroupSpendContract,
    DashboardMemberShareContract,
    DashboardMonthlySpendContract,
} from '@lib/api/contracts';

export type DashboardMemberShare = DashboardMemberShareContract;
export type DashboardMonthlySpend = DashboardMonthlySpendContract;
export type DashboardDailySpend = DashboardDailySpendContract;
export type DashboardGroupSpend = Omit<DashboardGroupSpendContract, 'spendingByDay'> & {
    spendingByDay?: DashboardDailySpend[];
};
export type DashboardSummary = Omit<DashboardContract, 'groupSpend'> & {
    groupSpend: DashboardGroupSpend[];
};

export interface DashboardDateRange {
    from: string;
    to: string;
}

export async function getDashboard(range?: DashboardDateRange): Promise<DashboardSummary> {
    const { data } = await httpClient.get<DashboardContract>('/dashboard', { params: range });
    return data;
}
