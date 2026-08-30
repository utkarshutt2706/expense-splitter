import { ArrowRightLeft } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import type { User } from '@features/users/api/usersApi';
import { useCreatePayment } from '@features/payments/hooks/useCreatePayment';
import { RecordPaymentDialog } from '../RecordPaymentDialog';
import type { RecordPaymentFormValues } from '../RecordPaymentForm';

type RecordPaymentActionProps = Readonly<{
    groupId: string;
    members: User[];
}>;

// Sits beside the balance summary rather than in a floating menu, where "record
// a payment" and "settle up" read as the same thing. Here the balance it acts on
// is right above it.
export function RecordPaymentAction({ groupId, members }: RecordPaymentActionProps) {
    const createPayment = useCreatePayment();
    const [isRecordingPayment, setIsRecordingPayment] = useState(false);
    const [paymentError, setPaymentError] = useState<string>();

    const handleRecordPayment = ({
        fromUserId,
        toUserId,
        amount,
        paidOn,
    }: RecordPaymentFormValues) => {
        if (createPayment.isPending) return;
        setPaymentError(undefined);
        const toastId = toast.loading('Payment is being recorded…');
        createPayment.mutate(
            { groupId, fromUserId, toUserId, amount, paidOn },
            {
                onSuccess: () => {
                    setIsRecordingPayment(false);
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
        <>
            {members.length > 1 && (
                <button
                    type="button"
                    onClick={() => {
                        setPaymentError(undefined);
                        setIsRecordingPayment(true);
                    }}
                    /* Deliberately not bg-owed: that green means "you are owed"
                       everywhere else, so it read as a status rather than an
                       action. A secondary button keeps the balance card above it
                       as the primary thing on this row. */
                    className="border-border text-surface-foreground hover:bg-muted focus-visible:ring-brand-500 inline-flex min-h-11 cursor-pointer items-center gap-2 self-start rounded-lg border px-4 text-sm font-medium outline-none focus-visible:ring-2"
                >
                    <ArrowRightLeft aria-hidden="true" className="size-4" />
                    Record a payment
                </button>
            )}

            <RecordPaymentDialog
                open={isRecordingPayment}
                onOpenChange={(open) => {
                    setIsRecordingPayment(open);
                    if (!open) setPaymentError(undefined);
                }}
                members={members}
                isPending={createPayment.isPending}
                errorMessage={paymentError}
                onSubmit={handleRecordPayment}
            />
        </>
    );
}
