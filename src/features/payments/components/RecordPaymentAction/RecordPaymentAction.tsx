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
    // Fired when the trigger button is clicked, before the dialog opens — lets a
    // parent fan-out menu (GroupFabMenu) collapse itself without this component
    // needing to know that menu exists.
    readonly onTriggerClick?: () => void;
}

export function RecordPaymentAction({
    groupId,
    members,
    onTriggerClick,
}: RecordPaymentActionProps) {
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
                    onClick={() => {
                        onTriggerClick?.();
                        setIsRecordingPayment(true);
                    }}
                    className="bg-owed inline-flex size-12 cursor-pointer items-center justify-center rounded-full text-white shadow-lg"
                >
                    <ArrowRightLeft className="size-5" />
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
