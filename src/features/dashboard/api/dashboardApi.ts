import { httpClient } from '@lib/api/httpClient';

export interface DashboardMemberShare {
    userId: string;
    name: string;
    amount: number;
    isCurrentUser: boolean;
}

export interface DashboardMonthlySpend {
    month: string;
    amount: number;
    actualPaid: number;
    currentUserShare: number;
}

export interface DashboardDailySpend {
    date: string;
    amount: number;
    actualPaid: number;
    currentUserShare: number;
}

export interface DashboardGroupSpend {
    groupId: string;
    name: string;
    amount: number;
    actualPaid: number;
    currentUserShare: number;
    currentBalance: number;
    memberShares: DashboardMemberShare[];
    spendingByMonth: DashboardMonthlySpend[];
    spendingByDay?: DashboardDailySpend[];
}

export interface DashboardSummary {
    actualPaid: number;
    currentUserShare: number;
    groupSpend: DashboardGroupSpend[];
}

export interface DashboardDateRange {
    from: string;
    to: string;
}

export async function getDashboard(range?: DashboardDateRange): Promise<DashboardSummary> {
    const { data } = await httpClient.get<DashboardSummary>('/dashboard', { params: range });
    return data;
}
