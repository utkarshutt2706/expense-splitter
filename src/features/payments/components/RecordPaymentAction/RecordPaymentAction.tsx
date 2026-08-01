import { ArrowRightLeft } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import type { User } from '@data/entities';
import { useCreatePayment } from '@features/payments/hooks/useCreatePayment';
import { RecordPaymentDialog } from '../RecordPaymentDialog';
import type { RecordPaymentFormValues } from '../RecordPaymentForm';

interface RecordPaymentActionProps {
    readonly groupId: string;
    readonly members: User[];
}

export function RecordPaymentAction({ groupId, members }: RecordPaymentActionProps) {
    const createPayment = useCreatePayment();
    const [isRecordingPayment, setIsRecordingPayment] = useState(false);

    const handleRecordPayment = ({ fromUserId, toUserId, amount }: RecordPaymentFormValues) => {
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
        <>
            {members.length > 1 && (
                <button
                    type="button"
                    aria-label="Record a payment"
                    title="Record a payment"
                    onClick={() => setIsRecordingPayment(true)}
                    className="border-border text-surface-foreground hover:bg-muted bg-surface fixed right-6 bottom-20 inline-flex cursor-pointer items-center gap-1 rounded-md border px-4 py-2 text-sm font-medium capitalize shadow-lg"
                >
                    <ArrowRightLeft className="size-4" />
                    Record payment
                </button>
            )}

            <RecordPaymentDialog
                open={isRecordingPayment}
                onOpenChange={setIsRecordingPayment}
                members={members}
                onSubmit={handleRecordPayment}
            />
        </>
    );
}
