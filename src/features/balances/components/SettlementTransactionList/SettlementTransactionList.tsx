import { Handshake } from 'lucide-react';

import type { SettlementTransaction } from '@features/balances/api/balancesApi';
import { formatCurrency } from '@shared/utils';

export type SettlementTransactionListProps = Readonly<{
    currentUserId?: string;
    items: SettlementTransaction[];
    nameFor: (id: string) => string;
    onSettle: (transaction: SettlementTransaction, trigger: HTMLButtonElement) => void;
}>;

export function SettlementTransactionList({
    currentUserId,
    items,
    nameFor,
    onSettle,
}: SettlementTransactionListProps) {
    return (
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
                                onClick={(event) => onSettle(item, event.currentTarget)}
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
}
