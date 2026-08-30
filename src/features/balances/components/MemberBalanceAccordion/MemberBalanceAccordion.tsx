import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown, Handshake } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import type { User } from '@features/users/api/usersApi';
import type { SettlementTransaction } from '@features/balances/api/balancesApi';
import { RecordPaymentDialog } from '@features/payments/components/RecordPaymentDialog';
import { useCreatePayment } from '@features/payments/hooks/useCreatePayment';
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
    const [settlingTransaction, setSettlingTransaction] = useState<SettlementTransaction | null>(
        null,
    );
    const createPayment = useCreatePayment();
    const [paymentError, setPaymentError] = useState<string>();
    const settleTriggerRef = useRef<HTMLButtonElement | null>(null);

    const handleSettleUp = ({
        fromUserId,
        toUserId,
        amount,
    }: {
        fromUserId: string;
        toUserId: string;
        amount: number;
    }) => {
        if (createPayment.isPending) return;
        setPaymentError(undefined);
        const toastId = toast.loading('Payment is being recorded…');
        createPayment.mutate(
            { groupId, fromUserId, toUserId, amount },
            {
                onSuccess: () => {
                    setSettlingTransaction(null);
                    toast.success('Payment recorded', { id: toastId });
                },
                onError: () => {
                    const message =
                        'We couldn’t record this payment. Nothing was changed. Try again.';
                    setPaymentError(message);
                    toast.error(message, { id: toastId });
                },
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
                                        settleTriggerRef.current = event.currentTarget;
                                        setPaymentError(undefined);
                                        setSettlingTransaction(transaction);
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
                onOpenChange={(open) => {
                    if (!open) {
                        setSettlingTransaction(null);
                        setPaymentError(undefined);
                        queueMicrotask(() => settleTriggerRef.current?.focus());
                    }
                }}
                members={members}
                initialValues={settlingTransaction ?? undefined}
                settlementMode
                isPending={createPayment.isPending}
                errorMessage={paymentError}
                onSubmit={handleSettleUp}
            />
        </Accordion.Item>
    );
}
