import * as Accordion from '@radix-ui/react-accordion';

import { useCurrentUser } from '@app/hooks';
import type { User } from '@data/entities';
import type { SettlementTransaction } from '@features/balances/api/balancesApi';
import { MemberBalanceAccordion } from '../MemberBalanceAccordion';

interface GroupBalanceAccordionListProps {
    readonly groupId: string;
    readonly members: User[];
    readonly netBalances: Map<string, number>;
    readonly transactions: SettlementTransaction[];
}

export function GroupBalanceAccordionList({
    groupId,
    members,
    netBalances,
    transactions,
}: GroupBalanceAccordionListProps) {
    const { data: currentUser } = useCurrentUser();
    const membersById = new Map(members.map((member) => [member.id, member]));

    // The current user always leads the list, settled or not — independent of
    // the expand/collapse rule below.
    const orderedMembers = [...members].sort((a, b) => {
        if (a.id === currentUser?.id) return -1;
        if (b.id === currentUser?.id) return 1;
        return 0;
    });

    // Only the first unsettled member (in the order above) starts expanded —
    // enough to draw attention without opening every non-zero balance at once.
    // Settled members (net exactly zero) always start collapsed.
    const expandedByDefault = orderedMembers
        .filter((member) => (netBalances.get(member.id) ?? 0) !== 0)
        .slice(0, 1)
        .map((member) => member.id);

    return (
        <Accordion.Root
            type="multiple"
            defaultValue={expandedByDefault}
            className="flex flex-col gap-3"
        >
            {orderedMembers.map((member) => (
                <MemberBalanceAccordion
                    key={member.id}
                    member={member}
                    netAmount={netBalances.get(member.id) ?? 0}
                    transactions={transactions.filter(
                        (transaction) =>
                            transaction.fromUserId === member.id ||
                            transaction.toUserId === member.id,
                    )}
                    membersById={membersById}
                    members={members}
                    groupId={groupId}
                    currentUserId={currentUser?.id}
                />
            ))}
        </Accordion.Root>
    );
}
