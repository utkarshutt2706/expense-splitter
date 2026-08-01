import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';

import type { User } from '@data/entities';
import type { SettlementTransaction } from '../../utils/simplifyDebts';

interface MemberBalanceAccordionProps {
    readonly member: User;
    readonly netAmount: number;
    readonly transactions: SettlementTransaction[];
    readonly membersById: Map<string, User>;
    readonly currentUserId: string | undefined;
}

function subjectName(
    userId: string,
    membersById: Map<string, User>,
    currentUserId: string | undefined,
): string {
    return userId === currentUserId ? 'You' : (membersById.get(userId)?.name ?? 'Someone');
}

function objectName(
    userId: string,
    membersById: Map<string, User>,
    currentUserId: string | undefined,
): string {
    return userId === currentUserId ? 'you' : (membersById.get(userId)?.name ?? 'someone');
}

function titleFor(
    member: User,
    netAmount: number,
    currentUserId: string | undefined,
): { text: string; className: string } {
    const isCurrentUser = member.id === currentUserId;
    const subject = isCurrentUser ? 'You' : member.name;

    if (netAmount > 0) {
        return {
            text: `${subject} get${isCurrentUser ? '' : 's'} back ₹${netAmount.toFixed(2)} in total`,
            className: 'text-owed',
        };
    }

    if (netAmount < 0) {
        return {
            text: `${subject} owe${isCurrentUser ? '' : 's'} ₹${Math.abs(netAmount).toFixed(2)} in total`,
            className: 'text-owe',
        };
    }

    return {
        text: `${subject} ${isCurrentUser ? 'are' : 'is'} settled up`,
        className: 'text-settled',
    };
}

export function MemberBalanceAccordion({
    member,
    netAmount,
    transactions,
    membersById,
    currentUserId,
}: MemberBalanceAccordionProps) {
    const title = titleFor(member, netAmount, currentUserId);

    return (
        <Accordion.Item value={member.id} className="border-border rounded-lg border">
            <Accordion.Header>
                <Accordion.Trigger
                    className={`group flex w-full cursor-pointer items-center justify-between gap-2 p-3 text-left text-sm font-medium ${title.className}`}
                >
                    {title.text}
                    <ChevronDown className="text-muted-foreground size-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="border-border border-t px-3 pb-3">
                {transactions.length === 0 ? (
                    <p className="text-muted-foreground pt-3 text-sm">No settlements needed.</p>
                ) : (
                    <ul className="flex flex-col gap-1 pt-3">
                        {transactions.map((transaction) => (
                            <li
                                key={`${transaction.fromUserId}-${transaction.toUserId}`}
                                className="text-muted-foreground text-sm"
                            >
                                {subjectName(transaction.fromUserId, membersById, currentUserId)}{' '}
                                owe{transaction.fromUserId === currentUserId ? '' : 's'} ₹
                                {transaction.amount.toFixed(2)} to{' '}
                                {objectName(transaction.toUserId, membersById, currentUserId)}
                            </li>
                        ))}
                    </ul>
                )}
            </Accordion.Content>
        </Accordion.Item>
    );
}
