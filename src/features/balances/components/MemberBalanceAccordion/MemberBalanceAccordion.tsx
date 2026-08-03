import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown, Handshake } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import type { User } from '@data/entities';
import type { SettlementTransaction } from '@features/balances/api/balancesApi';
import { RecordPaymentDialog } from '@features/payments/components/RecordPaymentDialog';
import { useCreatePayment } from '@features/payments/hooks/useCreatePayment';

interface MemberBalanceAccordionProps {
    readonly member: User;
    readonly netAmount: number;
    readonly transactions: SettlementTransaction[];
    readonly membersById: Map<string, User>;
    readonly members: User[];
    readonly groupId: string;
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
    members,
    groupId,
    currentUserId,
}: MemberBalanceAccordionProps) {
    const title = titleFor(member, netAmount, currentUserId);
    const [settlingTransaction, setSettlingTransaction] = useState<SettlementTransaction | null>(
        null,
    );
    const createPayment = useCreatePayment();

    const handleSettleUp = ({
        fromUserId,
        toUserId,
        amount,
    }: {
        fromUserId: string;
        toUserId: string;
        amount: number;
    }) => {
        const toastId = toast.loading('Payment is being recorded…');
        createPayment.mutate(
            { groupId, fromUserId, toUserId, amount },
            {
                onSuccess: () => toast.success('Payment recorded', { id: toastId }),
                onError: (error) => toast.error(error.message, { id: toastId }),
            },
        );
    };

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
                                    {subjectName(
                                        transaction.fromUserId,
                                        membersById,
                                        currentUserId,
                                    )}{' '}
                                    owe{transaction.fromUserId === currentUserId ? '' : 's'} ₹
                                    {transaction.amount.toFixed(2)} to{' '}
                                    {objectName(transaction.toUserId, membersById, currentUserId)}
                                </span>
                                <button
                                    type="button"
                                    aria-label="Settle up"
                                    title="Settle up"
                                    onClick={() => setSettlingTransaction(transaction)}
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
                onOpenChange={(open) => {
                    if (!open) setSettlingTransaction(null);
                }}
                members={members}
                initialValues={settlingTransaction ?? undefined}
                onSubmit={handleSettleUp}
            />
        </Accordion.Item>
    );
}
