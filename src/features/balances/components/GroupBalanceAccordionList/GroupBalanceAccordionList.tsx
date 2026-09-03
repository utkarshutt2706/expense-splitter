import type { ReactNode } from 'react';

import { useCurrentUser } from '@app/hooks';
import type { SettlementTransaction } from '@features/balances/api/balancesApi';
import { BalanceDisclosure } from '@features/balances/components/BalanceDisclosure';
import { BalancePositionValue } from '@features/balances/components/BalancePositionValue';
import { SettlementTransactionList } from '@features/balances/components/SettlementTransactionList';
import { SingleBalancePosition } from '@features/balances/components/SingleBalancePosition';
import { useMemberSettlement } from '@features/balances/hooks/useMemberSettlement';
import { groupBalanceViewModel } from '@features/balances/utils/groupBalanceViewModel';
import { RecordPaymentAction } from '@features/payments';
import { RecordPaymentDialog } from '@features/payments/components/RecordPaymentDialog';
import type { User } from '@features/users/api/usersApi';
import { formatCurrency } from '@shared/utils';

type Props = Readonly<{
    groupId: string;
    members: User[];
    netBalances: Map<string, number>;
    transactions: SettlementTransaction[];
}>;

export function GroupBalanceAccordionList({ groupId, members, netBalances, transactions }: Props) {
    const { data: currentUser } = useCurrentUser();
    const currentUserId = currentUser?.id;
    const { everyoneSettled, nameFor, net, others, personal, settled, toPay, toReceive } =
        groupBalanceViewModel(members, netBalances, transactions, currentUserId);
    const {
        isPending,
        openSettlement,
        paymentError,
        setSettlementOpen,
        settlingTransaction,
        submitSettlement,
    } = useMemberSettlement(groupId);
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
                            onSettle={openSettlement}
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
                        onSettle={openSettlement}
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
                open={settlingTransaction !== null}
                onOpenChange={setSettlementOpen}
                members={members}
                initialValues={settlingTransaction ?? undefined}
                settlementMode
                isPending={isPending}
                errorMessage={paymentError}
                onSubmit={submitSettlement}
            />
        </div>
    );
}
