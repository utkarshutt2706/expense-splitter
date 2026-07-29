import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';

import { useExpenses } from '@features/expenses/hooks/useExpenses';
import { calculateNetBalance } from '@features/expenses/utils/calculateNetBalance';
import { useGroup, useGroupMembers } from '@features/groups';
import { Skeleton, SkeletonList } from '@shared/components';
import { GroupBalanceAccordionList } from '../../components/GroupBalanceAccordionList';
import { simplifyDebts } from '../../utils/simplifyDebts';

export function GroupBalancePage() {
    const { groupId } = useParams<{ groupId: string }>();
    const {
        data: group,
        isLoading: isGroupLoading,
        isError: isGroupError,
    } = useGroup(groupId ?? '');
    const { data: members, isLoading: isMembersLoading } = useGroupMembers(group?.memberIds ?? []);
    const {
        data: expenses,
        isLoading: isExpensesLoading,
        isError: isExpensesError,
    } = useExpenses(groupId ?? '');

    const isLoading = isGroupLoading || isMembersLoading || isExpensesLoading;
    const isError = isGroupError || isExpensesError;

    let content: ReactNode;
    if (isLoading) {
        content = <SkeletonList label="Loading balances…" />;
    } else if (isError || !group) {
        content = <div className="text-red-600">Couldn't load balances.</div>;
    } else {
        const allMembers = members ?? [];
        const netBalances = new Map(
            allMembers.map((member) => [member.id, calculateNetBalance(expenses ?? [], member.id)]),
        );
        const transactions = simplifyDebts(
            allMembers.map((member) => ({
                userId: member.id,
                amount: netBalances.get(member.id) ?? 0,
            })),
        );

        content = (
            <GroupBalanceAccordionList
                members={allMembers}
                netBalances={netBalances}
                transactions={transactions}
            />
        );
    }

    return (
        <div>
            <Link
                to={`/groups/${groupId}`}
                className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-surface-foreground"
            >
                <ArrowLeft className="size-4" />
                Back to group
            </Link>

            <h1 className="mb-4 font-display text-xl font-medium text-surface-foreground">
                {isLoading ? <Skeleton className="h-7 w-40" /> : (group?.name ?? 'Balances')}
            </h1>

            {content}
        </div>
    );
}
