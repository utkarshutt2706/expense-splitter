import { httpClient } from '@lib/api/httpClient';

export interface DashboardMemberShare {
    userId: string;
    name: string;
    amount: number;
    isCurrentUser: boolean;
}

export interface DashboardGroupSpend {
    groupId: string;
    name: string;
    amount: number;
}

export interface DashboardSummary {
    actualPaid: number;
    currentUserShare: number;
    memberShares: DashboardMemberShare[];
    groupSpend: DashboardGroupSpend[];
}

export async function getDashboard(): Promise<DashboardSummary> {
    const { data } = await httpClient.get<DashboardSummary>('/dashboard');
    return data;
}
