import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown, Handshake } from 'lucide-react';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { useCurrentUser } from '@app/hooks';
import type { User } from '@features/users/api/usersApi';
import type { SettlementTransaction } from '@features/balances/api/balancesApi';
import { RecordPaymentAction } from '@features/payments';
import { RecordPaymentDialog } from '@features/payments/components/RecordPaymentDialog';
import type { RecordPaymentFormValues } from '@features/payments/components/RecordPaymentForm';
import { useCreatePayment } from '@features/payments/hooks/useCreatePayment';
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
        <SinglePosition
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
                <PositionValue label="To receive" amount={toReceive} tone="receive" />
                <PositionValue label="To pay" amount={toPay} tone="pay" />
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
            <SinglePosition
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

    const rows = (items: SettlementTransaction[]) => (
        <ul>
            {items.map((item, index) => {
                const payerName = nameFor(item.fromUserId);
                const direction = `${payerName} ${payerName === 'You' ? 'owe' : 'owes'} ${nameFor(item.toUserId)}`;
                const sentence = `${direction} ${formatCurrency(item.amount)}`;
                const isPaying = item.fromUserId === currentUserId;
                const isReceiving = item.toUserId === currentUserId;
                const amountClass = isReceiving ? 'text-owed' : 'text-owe';
                return (
                    <li
                        key={`${item.fromUserId}-${item.toUserId}-${item.amount}-${index}`}
                        className="border-border flex items-center gap-3 border-b py-3 last:border-b-0 sm:py-4"
                    >
                        <div className="min-w-0 flex-1">
                            <p className="text-surface-foreground font-medium break-words">
                                {direction}{' '}
                                <span className={`${amountClass} font-semibold whitespace-nowrap`}>
                                    {formatCurrency(item.amount)}
                                </span>
                            </p>
                            {(isPaying || isReceiving) && (
                                <p className="text-muted-foreground mt-1 text-sm">
                                    {isPaying
                                        ? 'You need to make this payment.'
                                        : 'You will receive this payment.'}
                                </p>
                            )}
                        </div>
                        <div className="shrink-0">
                            <button
                                type="button"
                                aria-label={`Settle up: ${sentence}`}
                                onClick={(event) => {
                                    triggerRef.current = event.currentTarget;
                                    setPaymentError(undefined);
                                    setSelected(item);
                                }}
                                className="border-border hover:bg-muted inline-flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded-md border px-3 py-2 text-sm font-medium"
                            >
                                <Handshake className="size-4" /> Settle up
                            </button>
                        </div>
                    </li>
                );
            })}
        </ul>
    );

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
                        {rows(personal)}
                    </div>
                ) : (
                    <p className="text-muted-foreground mt-2 text-sm">
                        You have no outstanding settlements in this group.
                    </p>
                )}
            </section>

            {others.length > 0 && (
                <Disclosure
                    value="others"
                    label={`Other group balances (${others.length})`}
                    description="Payments between other participants"
                >
                    {rows(others)}
                </Disclosure>
            )}

            {settled.length > 0 && (
                <Disclosure value="settled" label={`Settled participants (${settled.length})`}>
                    <ul className="divide-border divide-y">
                        {settled.map((member) => (
                            <li key={member.id} className="flex justify-between gap-3 py-3 text-sm">
                                <span className="min-w-0 break-words">{nameFor(member.id)}</span>
                                <span className="text-muted-foreground shrink-0">Settled up</span>
                            </li>
                        ))}
                    </ul>
                </Disclosure>
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

function PositionValue({
    label,
    amount,
    tone,
}: Readonly<{
    label: string;
    amount: number;
    tone: string;
}>) {
    return (
        <div>
            <p className="text-muted-foreground text-sm">{label}</p>
            <p
                className={
                    tone === 'receive' ? 'text-owed font-semibold' : 'text-owe font-semibold'
                }
            >
                {formatCurrency(amount)}
            </p>
        </div>
    );
}

function SinglePosition({
    text,
    count,
    suffix,
    tone,
}: Readonly<{
    text: string;
    count: number;
    suffix: string;
    tone: string;
}>) {
    return (
        <>
            <p
                className={
                    tone === 'receive'
                        ? 'text-owed text-lg font-semibold'
                        : 'text-owe text-lg font-semibold'
                }
            >
                {text}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
                {count} {count === 1 ? 'payment' : 'payments'} {suffix}
            </p>
        </>
    );
}

function Disclosure({
    value,
    label,
    description,
    children,
}: Readonly<{
    value: string;
    label: string;
    description?: string;
    children: ReactNode;
}>) {
    return (
        <Accordion.Root type="single" collapsible>
            <Accordion.Item value={value} className="border-border rounded-xl border">
                <Accordion.Header>
                    <Accordion.Trigger className="group focus-visible:ring-brand-500 flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-xl p-3 text-left outline-none focus-visible:ring-2 sm:p-4">
                        <span>
                            <span className="text-lg font-semibold">{label}</span>
                            {description && (
                                <span className="text-muted-foreground mt-0.5 block text-sm">
                                    {description}
                                </span>
                            )}
                        </span>
                        <ChevronDown className="text-muted-foreground size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
                    </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="border-border px-3 data-[state=open]:border-t sm:px-4">
                    {children}
                </Accordion.Content>
            </Accordion.Item>
        </Accordion.Root>
    );
}
