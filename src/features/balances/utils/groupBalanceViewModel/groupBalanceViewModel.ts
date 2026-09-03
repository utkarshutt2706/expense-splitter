import type { SettlementTransaction } from '@features/balances/api/balancesApi';
import type { User } from '@features/users/api/usersApi';
import { participantNameMap, sortMembersByName } from '@shared/utils';

export function groupBalanceViewModel(
    members: User[],
    netBalances: ReadonlyMap<string, number>,
    transactions: SettlementTransaction[],
    currentUserId?: string,
) {
    const membersById = new Map(members.map((member) => [member.id, member]));
    const names = participantNameMap(members, currentUserId);
    const nameFor = (id: string) => names.get(id) ?? membersById.get(id)?.name ?? 'Unknown member';
    const personal = transactions
        .filter(({ fromUserId, toUserId }) => [fromUserId, toUserId].includes(currentUserId ?? ''))
        .sort((a, b) => {
            const aPay = a.fromUserId === currentUserId;
            const bPay = b.fromUserId === currentUserId;
            if (aPay !== bPay) return aPay ? -1 : 1;
            return b.amount - a.amount;
        });
    const others = transactions
        .filter(
            ({ fromUserId, toUserId }) =>
                fromUserId !== currentUserId && toUserId !== currentUserId,
        )
        .sort(
            (left, right) =>
                nameFor(left.fromUserId).localeCompare(nameFor(right.fromUserId)) ||
                nameFor(left.toUserId).localeCompare(nameFor(right.toUserId)),
        );
    const settled = sortMembersByName(
        members.filter(
            (member) =>
                member.id !== currentUserId &&
                netBalances.has(member.id) &&
                netBalances.get(member.id) === 0,
        ),
    );
    const toPay = personal
        .filter(({ fromUserId }) => fromUserId === currentUserId)
        .reduce((sum, item) => sum + item.amount, 0);
    const toReceive = personal
        .filter(({ toUserId }) => toUserId === currentUserId)
        .reduce((sum, item) => sum + item.amount, 0);

    return {
        everyoneSettled: transactions.length === 0 && netBalances.size > 0,
        nameFor,
        net: netBalances.get(currentUserId ?? '') ?? toReceive - toPay,
        others,
        personal,
        settled,
        toPay,
        toReceive,
    };
}
