import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown, Handshake } from 'lucide-react';

import type { User } from '@features/users/api/usersApi';
import type { SettlementTransaction } from '@features/balances/api/balancesApi';
import { useMemberSettlement } from '@features/balances/hooks/useMemberSettlement';
import { RecordPaymentDialog } from '@features/payments/components/RecordPaymentDialog';
import { formatCurrency, participantNameMap } from '@shared/utils';

type MemberBalanceAccordionProps = Readonly<{
    member: User;
    netAmount: number;
    transactions: SettlementTransaction[];
    members: User[];
    groupId: string;
    currentUserId: string | undefined;
}>;

function subjectName(userId: string, names: Map<string, string>): string {
    return names.get(userId) ?? 'Someone';
}

function objectName(userId: string, names: Map<string, string>): string {
    return names.get(userId) ?? 'someone';
}

function titleFor(netAmount: number, subject: string): { text: string; className: string } {
    if (netAmount > 0) {
        return {
            text: `${subject} ${subject === 'You' ? 'get' : 'gets'} back ${formatCurrency(netAmount)} in total`,
            className: 'text-owed',
        };
    }

    if (netAmount < 0) {
        return {
            text: `${subject} ${subject === 'You' ? 'owe' : 'owes'} ${formatCurrency(Math.abs(netAmount))} in total`,
            className: 'text-owe',
        };
    }

    return {
        text: `${subject} ${subject === 'You' ? 'are' : 'is'} settled up`,
        className: 'text-settled',
    };
}

export function MemberBalanceAccordion({
    member,
    netAmount,
    transactions,
    members,
    groupId,
    currentUserId,
}: MemberBalanceAccordionProps) {
    const names = participantNameMap(members, currentUserId);
    const title = titleFor(netAmount, names.get(member.id) ?? member.name);
    const {
        isPending,
        openSettlement,
        paymentError,
        setSettlementOpen,
        settlingTransaction,
        submitSettlement,
    } = useMemberSettlement(groupId);

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
                    <ul className="flex flex-col gap-2 pt-3">
                        {transactions.map((transaction) => (
                            <li
                                key={`${transaction.fromUserId}-${transaction.toUserId}`}
                                className="flex items-center justify-between gap-2"
                            >
                                <span className="text-muted-foreground text-sm">
                                    {subjectName(transaction.fromUserId, names)}{' '}
                                    {subjectName(transaction.fromUserId, names) === 'You'
                                        ? 'owe'
                                        : 'owes'}{' '}
                                    {formatCurrency(transaction.amount)} to{' '}
                                    {objectName(transaction.toUserId, names)}
                                </span>
                                <button
                                    type="button"
                                    aria-label="Settle up"
                                    title="Settle up"
                                    onClick={(event) => {
                                        openSettlement(transaction, event.currentTarget);
                                    }}
                                    className="border-border text-surface-foreground hover:bg-muted inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium"
                                >
                                    <Handshake className="size-3.5" />
                                    Settle up
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </Accordion.Content>

            <RecordPaymentDialog
                open={settlingTransaction !== null}
                onOpenChange={setSettlementOpen}
                members={members}
                initialValues={settlingTransaction ?? undefined}
                settlementMode
                isPending={isPending}
                errorMessage={paymentError}
                onSubmit={submitSettlement}
            />
        </Accordion.Item>
    );
}
