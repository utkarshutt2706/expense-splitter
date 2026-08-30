import { httpClient } from '@lib/api/httpClient';
import type {
    GroupBalancesContract,
    MemberBalanceContract,
    SettlementTransactionContract,
} from '@lib/api/contracts';

export type MemberBalance = MemberBalanceContract;
export type SettlementTransaction = SettlementTransactionContract;
export type GroupBalances = GroupBalancesContract;

export async function getByGroupId(groupId: string): Promise<GroupBalances> {
    const { data } = await httpClient.get<GroupBalances>(`/groups/${groupId}/balances`);
    return data;
}
