import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { useCurrentUser } from '@app/hooks';
import type { SettlementTransaction } from '@features/balances/api/balancesApi';
import { BalanceDisclosure } from '@features/balances/components/BalanceDisclosure';
import { BalancePositionValue } from '@features/balances/components/BalancePositionValue';
import { SettlementTransactionList } from '@features/balances/components/SettlementTransactionList';
import { SingleBalancePosition } from '@features/balances/components/SingleBalancePosition';
import { RecordPaymentAction } from '@features/payments';
import { RecordPaymentDialog } from '@features/payments/components/RecordPaymentDialog';
import type { RecordPaymentFormValues } from '@features/payments/components/RecordPaymentForm';
import { useCreatePayment } from '@features/payments/hooks/useCreatePayment';
import type { User } from '@features/users/api/usersApi';
import { formatCurrency, participantNameMap, sortMembersByName } from '@shared/utils';

type Props = Readonly<{
    groupId: string;
    members: User[];
    netBalances: Map<string, number>;
    transactions: SettlementTransaction[];
}>;

export function GroupBalanceAccordionList({ groupId, members, netBalances, transactions }: Props) {
    const { data: currentUser } = useCurrentUser();
    const currentUserId = currentUser?.id;
    const membersById = new Map(members.map((member) => [member.id, member]));
    const names = participantNameMap(members, currentUserId);
    const [selected, setSelected] = useState<SettlementTransaction>();
    const [paymentError, setPaymentError] = useState<string>();
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const createPayment = useCreatePayment();
    const nameFor = (id: string) => names.get(id) ?? membersById.get(id)?.name ?? 'Unknown member';

    const personal = transactions
        .filter(({ fromUserId, toUserId }) => [fromUserId, toUserId].includes(currentUserId ?? ''))
        .sort((a, b) => {
            const aPay = a.fromUserId === currentUserId;
            const bPay = b.fromUserId === currentUserId;
            if (aPay !== bPay) return aPay ? -1 : 1;
            return b.amount - a.amount;
        });
    // Rows between other people had no defined order; sort them by who owes,
    // then by who is owed. `personal` keeps its own ordering (payments to make
    // first, then by size) — that is a priority list, not a member list.
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
    const net = netBalances.get(currentUserId ?? '') ?? toReceive - toPay;
    const everyoneSettled = transactions.length === 0 && netBalances.size > 0;
    let positionContent: ReactNode = (
        <SingleBalancePosition
            text={`You owe ${formatCurrency(toPay)}`}
            count={personal.length}
            suffix="to make"
            tone="pay"
        />
    );
    if (toPay === 0 && toReceive === 0) {
        positionContent = (
            <>
                <p className="font-semibold">You are settled up</p>
                <p className="text-muted-foreground mt-1 text-sm">
                    You have no outstanding payments in this group.
                </p>
            </>
        );
    } else if (toPay > 0 && toReceive > 0) {
        positionContent = (
            <div className="grid gap-3 sm:grid-cols-3">
                <BalancePositionValue label="To receive" amount={toReceive} tone="receive" />
                <BalancePositionValue label="To pay" amount={toPay} tone="pay" />
                <div>
                    <p className="text-muted-foreground text-sm">Net position</p>
                    <p className="font-semibold">
                        {formatCurrency(Math.abs(net))} {net >= 0 ? 'to receive' : 'to pay'}
                    </p>
                </div>
            </div>
        );
    } else if (toReceive > 0) {
        positionContent = (
            <SingleBalancePosition
                text={`You are owed ${formatCurrency(toReceive)}`}
                count={personal.length}
                suffix="to receive"
                tone="receive"
            />
        );
    }

    const recordPayment = (values: RecordPaymentFormValues) => {
        if (createPayment.isPending) return;
        setPaymentError(undefined);
        const toastId = toast.loading('Payment is being recorded…');
        createPayment.mutate(
            { groupId, ...values },
            {
                onSuccess: () => {
                    setSelected(undefined);
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
        <div className="flex flex-col gap-5 sm:gap-6">
            {everyoneSettled && (
                <section aria-labelledby="everyone-settled-heading">
                    <h2 id="everyone-settled-heading" className="text-xl font-semibold">
                        Everyone is settled up
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        There are no outstanding payments in this group.
                    </p>
                </section>
            )}

            <section aria-labelledby="your-position-heading">
                {/* Paired with the heading it acts on: this is the screen where a
                    reader can already see who they owe and how much. */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 id="your-position-heading" className="text-xl font-semibold">
                        Your position
                    </h2>

                    <RecordPaymentAction groupId={groupId} members={members} />
                </div>
                <div className="border-border bg-surface mt-2 rounded-xl border p-3 sm:mt-3 sm:p-4">
                    {positionContent}
                </div>
            </section>

            <section aria-labelledby="your-settlements-heading">
                <h2 id="your-settlements-heading" className="text-xl font-semibold">
                    Your settlements
                </h2>
                {personal.length > 0 ? (
                    <div className="border-border mt-2 rounded-xl border px-3 sm:px-4">
                        <SettlementTransactionList
                            currentUserId={currentUserId}
                            items={personal}
                            nameFor={nameFor}
                            onSettle={(transaction, trigger) => {
                                triggerRef.current = trigger;
                                setPaymentError(undefined);
                                setSelected(transaction);
                            }}
                        />
                    </div>
                ) : (
                    <p className="text-muted-foreground mt-2 text-sm">
                        You have no outstanding settlements in this group.
                    </p>
                )}
            </section>

            {others.length > 0 && (
                <BalanceDisclosure
                    value="others"
                    label={`Other group balances (${others.length})`}
                    description="Payments between other participants"
                >
                    <SettlementTransactionList
                        currentUserId={currentUserId}
                        items={others}
                        nameFor={nameFor}
                        onSettle={(transaction, trigger) => {
                            triggerRef.current = trigger;
                            setPaymentError(undefined);
                            setSelected(transaction);
                        }}
                    />
                </BalanceDisclosure>
            )}

            {settled.length > 0 && (
                <BalanceDisclosure
                    value="settled"
                    label={`Settled participants (${settled.length})`}
                >
                    <ul className="divide-border divide-y">
                        {settled.map((member) => (
                            <li key={member.id} className="flex justify-between gap-3 py-3 text-sm">
                                <span className="min-w-0 break-words">{nameFor(member.id)}</span>
                                <span className="text-muted-foreground shrink-0">Settled up</span>
                            </li>
                        ))}
                    </ul>
                </BalanceDisclosure>
            )}

            <RecordPaymentDialog
                open={selected !== undefined}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelected(undefined);
                        setPaymentError(undefined);
                        queueMicrotask(() => triggerRef.current?.focus());
                    }
                }}
                members={members}
                initialValues={selected}
                settlementMode
                isPending={createPayment.isPending}
                errorMessage={paymentError}
                onSubmit={recordPayment}
            />
        </div>
    );
}
