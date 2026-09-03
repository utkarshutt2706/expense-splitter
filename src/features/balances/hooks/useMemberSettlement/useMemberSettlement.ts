import { useRef, useState } from 'react';
import { toast } from 'sonner';

import type { SettlementTransaction } from '@features/balances/api/balancesApi';
import type { RecordPaymentFormValues } from '@features/payments/components/RecordPaymentForm';
import { useCreatePayment } from '@features/payments/hooks/useCreatePayment';

const PAYMENT_ERROR_MESSAGE = 'We couldn’t record this payment. Nothing was changed. Try again.';

export function useMemberSettlement(groupId: string) {
    const [settlingTransaction, setSettlingTransaction] = useState<SettlementTransaction | null>(
        null,
    );
    const [paymentError, setPaymentError] = useState<string>();
    const settleTriggerRef = useRef<HTMLButtonElement | null>(null);
    const createPayment = useCreatePayment();

    const openSettlement = (transaction: SettlementTransaction, trigger: HTMLButtonElement) => {
        settleTriggerRef.current = trigger;
        setPaymentError(undefined);
        setSettlingTransaction(transaction);
    };

    const setSettlementOpen = (open: boolean) => {
        if (!open) {
            setSettlingTransaction(null);
            setPaymentError(undefined);
            queueMicrotask(() => settleTriggerRef.current?.focus());
        }
    };

    const submitSettlement = ({
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
                    setSettlingTransaction(null);
                    toast.success('Payment recorded', { id: toastId });
                },
                onError: () => {
                    setPaymentError(PAYMENT_ERROR_MESSAGE);
                    toast.error(PAYMENT_ERROR_MESSAGE, { id: toastId });
                },
            },
        );
    };

    return {
        isPending: createPayment.isPending,
        openSettlement,
        paymentError,
        setSettlementOpen,
        settlingTransaction,
        submitSettlement,
    };
}
