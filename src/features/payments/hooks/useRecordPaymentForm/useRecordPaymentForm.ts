import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { useCurrentUser } from '@app/hooks';
import type { User } from '@features/users/api/usersApi';
import {
    formatCurrency,
    localDateInputValue,
    normalizeDateInputValue,
    participantNameMap,
} from '@shared/utils';

const recordPaymentSchema = z
    .object({
        fromUserId: z.string().min(1, 'Select who paid'),
        toUserId: z.string().min(1, 'Select who received it'),
        paidOn: z
            .string()
            .min(1, 'Paid date is required')
            .refine(
                (value) => value <= localDateInputValue(new Date()),
                'Paid date cannot be in the future',
            ),
        amount: z
            .number({ error: 'Amount is required' })
            .positive('Amount must be greater than zero')
            .refine(
                (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
                'Amount can have at most two decimal places',
            ),
    })
    .refine((values) => values.fromUserId !== values.toUserId, {
        message: 'Choose two different people',
        path: ['toUserId'],
    });

export interface RecordPaymentFormValues {
    fromUserId: string;
    toUserId: string;
    amount: number;
    paidOn: string;
}

export interface RecordPaymentFormInitialValues {
    fromUserId: string;
    toUserId: string;
    amount: number;
    paidOn?: string;
}

export type UseRecordPaymentFormOptions = Readonly<{
    members: User[];
    initialValues?: RecordPaymentFormInitialValues;
    onSubmit: (values: RecordPaymentFormValues) => void;
    lockParticipants: boolean;
    outstandingAmount?: number;
}>;

export function useRecordPaymentForm({
    members,
    initialValues,
    onSubmit,
    lockParticipants,
    outstandingAmount,
}: UseRecordPaymentFormOptions) {
    const amountInputRef = useRef<HTMLInputElement | null>(null);
    const { data: currentUser } = useCurrentUser();
    const form = useForm<RecordPaymentFormValues>({
        resolver: zodResolver(recordPaymentSchema),
        defaultValues: {
            fromUserId: initialValues?.fromUserId ?? currentUser?.id ?? '',
            toUserId: initialValues?.toUserId ?? '',
            amount: initialValues?.amount,
            paidOn:
                normalizeDateInputValue(initialValues?.paidOn) ?? localDateInputValue(new Date()),
        },
    });
    const enteredAmount = useWatch({ control: form.control, name: 'amount' });
    const names = participantNameMap(members, currentUser?.id);
    const amountCents = Number.isFinite(enteredAmount) ? Math.round(enteredAmount * 100) : 0;
    const outstandingCents =
        outstandingAmount === undefined ? undefined : Math.round(outstandingAmount * 100);

    const submit = form.handleSubmit((values) => {
        if (
            outstandingAmount !== undefined &&
            Math.round(values.amount * 100) > Math.round(outstandingAmount * 100)
        ) {
            form.setError('amount', {
                message: `Amount cannot exceed the outstanding balance of ${formatCurrency(outstandingAmount)}`,
            });
            return;
        }
        onSubmit(values);
    });

    let amountDescriptionId: string | undefined;
    if (form.formState.errors.amount) amountDescriptionId = 'payment-amount-error';
    else if (outstandingAmount !== undefined) amountDescriptionId = 'payment-impact';

    let paymentImpact = `Amount cannot exceed the outstanding balance of ${formatCurrency(outstandingAmount ?? 0)}.`;
    if (amountCents === outstandingCents) {
        paymentImpact = 'This settles the suggested balance in full.';
    } else if (outstandingCents !== undefined && amountCents < outstandingCents) {
        paymentImpact = `${formatCurrency((outstandingCents - amountCents) / 100)} will remain after this payment.`;
    }

    useEffect(() => {
        if (lockParticipants) amountInputRef.current?.focus();
    }, [lockParticipants]);

    return {
        ...form,
        amountCents,
        amountDescriptionId,
        amountInputRef,
        memberName: (id: string) => names.get(id) ?? 'Unknown member',
        outstandingCents,
        paymentImpact,
        submit,
    };
}
