import { ArrowRightLeft, Pencil, Trash2 } from 'lucide-react';

import type { Payment } from '@features/payments/api/paymentsApi';
import type { User } from '@features/users/api/usersApi';
import { SwipeableRow } from '@shared/components';
import { formatCurrency } from '@shared/utils';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});

function memberLabel(member: User | undefined, names: Map<string, string>): string {
    if (!member) return 'Someone';
    return names.get(member.id) ?? member.name;
}

export type PaymentActivityRowProps = Readonly<{
    payment: Payment;
    membersById: Map<string, User>;
    names: Map<string, string>;
    onEdit: () => void;
    onDelete: () => void;
}>;

// No detail page exists for a payment (it's a single atomic record, nothing to
// drill into), so this renders as a plain div rather than a link.
export function PaymentActivityRow({
    payment,
    membersById,
    names,
    onEdit,
    onDelete,
}: PaymentActivityRowProps) {
    const from = membersById.get(payment.fromUserId);
    const to = membersById.get(payment.toUserId);

    return (
        <SwipeableRow
            actions={[
                {
                    key: 'edit',
                    label: 'Edit',
                    icon: Pencil,
                    onClick: onEdit,
                },
                {
                    key: 'delete',
                    label: 'Delete',
                    icon: Trash2,
                    tone: 'destructive',
                    onClick: onDelete,
                },
            ]}
        >
            <div className="border-border bg-owed/5 flex items-center gap-3 rounded-lg border p-3">
                <span className="bg-owed/10 text-owed flex size-9 shrink-0 items-center justify-center rounded-full">
                    <ArrowRightLeft className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-surface-foreground font-medium">
                        {memberLabel(from, names)} paid {memberLabel(to, names)}
                    </p>
                    <p className="text-muted-foreground text-sm">
                        {dateFormatter.format(new Date(payment.paidOn ?? payment.createdAt))}
                    </p>
                </div>
                <p className="text-owed font-medium">{formatCurrency(payment.amount)}</p>
            </div>
        </SwipeableRow>
    );
}
