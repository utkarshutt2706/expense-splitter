import type { GroupBalances } from '@features/balances/api/balancesApi';
import type { User } from '@features/users/api/usersApi';

export function balanceSummaryViewModel(
    groupBalances: GroupBalances,
    members: User[],
    currentUserId: string,
) {
    const balancesByUserId = new Map(
        groupBalances.balances.map((entry) => [entry.userId, entry.balance]),
    );
    const balance = balancesByUserId.get(currentUserId) ?? 0;
    const personalTransactions = groupBalances.settlements.filter(({ fromUserId, toUserId }) =>
        [fromUserId, toUserId].includes(currentUserId),
    );
    const toPay = personalTransactions
        .filter(({ fromUserId }) => fromUserId === currentUserId)
        .reduce((total, item) => total + item.amount, 0);
    const toReceive = personalTransactions
        .filter(({ toUserId }) => toUserId === currentUserId)
        .reduce((total, item) => total + item.amount, 0);
    return {
        balance,
        hasFinancialActivity:
            groupBalances.balances.length > 0 || groupBalances.settlements.length > 0,
        isGroupFullySettled:
            members.length > 0 &&
            groupBalances.balances.length > 0 &&
            members.every((member) => (balancesByUserId.get(member.id) ?? 0) === 0),
        isMixedPosition: toPay > 0 && toReceive > 0,
        isPersonallySettled: balance === 0,
        toPay,
        toReceive,
    };
}
