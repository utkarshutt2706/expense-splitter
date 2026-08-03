import { httpClient } from '@lib/api/httpClient';

export interface MemberBalance {
    userId: string;
    balance: number;
}

export interface SettlementTransaction {
    fromUserId: string;
    toUserId: string;
    amount: number;
}

export interface GroupBalances {
    balances: MemberBalance[];
    settlements: SettlementTransaction[];
}

export async function getByGroupId(groupId: string): Promise<GroupBalances> {
    const { data } = await httpClient.get<GroupBalances>(`/groups/${groupId}/balances`);
    return data;
}
