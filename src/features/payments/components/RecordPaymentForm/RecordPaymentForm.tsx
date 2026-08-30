import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRightLeft } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { useCurrentUser } from '@app/hooks';
import type { User } from '@features/users/api/usersApi';
import { CurrencyInput, MemberPicker } from '@shared/components';
import {
    formatCurrency,
    localDateInputValue,
    normalizeDateInputValue,
    openDatePicker,
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
            .number({
                error: 'Amount is required',
            })
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

type RecordPaymentFormProps = Readonly<{
    members: User[];
    initialValues?: RecordPaymentFormInitialValues;
    onSubmit: (values: RecordPaymentFormValues) => void;
    onCancel: () => void;
    submitLabel?: string;
    lockParticipants?: boolean;
    outstandingAmount?: number;
    isPending?: boolean;
    errorMessage?: string;
}>;

export function RecordPaymentForm({
    members,
    initialValues,
    onSubmit,
    onCancel,
    submitLabel = 'Record payment',
    lockParticipants = false,
    outstandingAmount,
    isPending = false,
    errorMessage,
}: RecordPaymentFormProps) {
    const amountInputRef = useRef<HTMLInputElement | null>(null);
    const { data: currentUser } = useCurrentUser();
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        setError,
    } = useForm<RecordPaymentFormValues>({
        resolver: zodResolver(recordPaymentSchema),
        defaultValues: {
            fromUserId: initialValues?.fromUserId ?? currentUser?.id ?? '',
            toUserId: initialValues?.toUserId ?? '',
            amount: initialValues?.amount,
            paidOn:
                normalizeDateInputValue(initialValues?.paidOn) ?? localDateInputValue(new Date()),
        },
    });
    const enteredAmount = useWatch({ control, name: 'amount' });

    const submit = handleSubmit((values) => {
        if (
            outstandingAmount !== undefined &&
            Math.round(values.amount * 100) > Math.round(outstandingAmount * 100)
        ) {
            setError('amount', {
                message: `Amount cannot exceed the outstanding balance of ${formatCurrency(outstandingAmount)}`,
            });
            return;
        }
        onSubmit(values);
    });
    const names = participantNameMap(members, currentUser?.id);
    const memberName = (id: string) => names.get(id) ?? 'Unknown member';
    const amountCents = Number.isFinite(enteredAmount) ? Math.round(enteredAmount * 100) : 0;
    const outstandingCents =
        outstandingAmount === undefined ? undefined : Math.round(outstandingAmount * 100);
    const amountRegistration = register('amount', { valueAsNumber: true });
    let amountDescriptionId: string | undefined;
    if (errors.amount) amountDescriptionId = 'payment-amount-error';
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

    return (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <span className="text-surface-foreground text-sm font-medium">From</span>
                {lockParticipants && initialValues ? (
                    <div
                        aria-label={`From: ${memberName(initialValues.fromUserId)}`}
                        className="border-border bg-muted/40 text-surface-foreground flex min-h-11 items-center rounded-md border px-3 text-sm"
                    >
                        {memberName(initialValues.fromUserId)}
                    </div>
                ) : (
                    <Controller
                        name="fromUserId"
                        control={control}
                        render={({ field }) => (
                            <MemberPicker
                                members={members}
                                value={field.value}
                                onChange={field.onChange}
                                ariaLabel="From"
                                placeholder="Select who paid"
                            />
                        )}
                    />
                )}
                {errors.fromUserId && (
                    <p className="text-xs text-red-600">{errors.fromUserId.message}</p>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-surface-foreground text-sm font-medium">To</span>
                {lockParticipants && initialValues ? (
                    <div
                        aria-label={`To: ${memberName(initialValues.toUserId)}`}
                        className="border-border bg-muted/40 text-surface-foreground flex min-h-11 items-center rounded-md border px-3 text-sm"
                    >
                        {memberName(initialValues.toUserId)}
                    </div>
                ) : (
                    <Controller
                        name="toUserId"
                        control={control}
                        render={({ field }) => (
                            <MemberPicker
                                members={members}
                                value={field.value}
                                onChange={field.onChange}
                                ariaLabel="To"
                                placeholder="Select who received it"
                            />
                        )}
                    />
                )}
                {errors.toUserId && (
                    <p className="text-xs text-red-600">{errors.toUserId.message}</p>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <label
                    htmlFor="payment-paid-on"
                    className="text-surface-foreground text-sm font-medium"
                >
                    Paid on
                </label>
                <input
                    id="payment-paid-on"
                    type="date"
                    max={localDateInputValue(new Date())}
                    onClick={(event) => openDatePicker(event.currentTarget)}
                    {...register('paidOn')}
                    className="border-border bg-surface text-surface-foreground focus-visible:ring-brand-500 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                />
                {errors.paidOn && <p className="text-xs text-red-600">{errors.paidOn.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
                <label
                    htmlFor="payment-amount"
                    className="text-surface-foreground text-sm font-medium"
                >
                    Amount
                </label>
                <span id="payment-currency-description" className="sr-only">
                    Enter the amount in rupees.
                </span>
                <CurrencyInput
                    id="payment-amount"
                    step="0.01"
                    min="0"
                    max={outstandingAmount}
                    placeholder="0.00"
                    aria-invalid={errors.amount ? 'true' : undefined}
                    aria-describedby={['payment-currency-description', amountDescriptionId]
                        .filter(Boolean)
                        .join(' ')}
                    {...amountRegistration}
                    ref={(element) => {
                        amountRegistration.ref(element);
                        amountInputRef.current = element;
                    }}
                />
                {errors.amount && (
                    <p id="payment-amount-error" className="text-xs text-red-600">
                        {errors.amount.message}
                    </p>
                )}
                {outstandingCents !== undefined && amountCents > 0 && !errors.amount && (
                    <p
                        id="payment-impact"
                        aria-live="polite"
                        className="text-muted-foreground text-sm"
                    >
                        {paymentImpact}
                    </p>
                )}
            </div>

            {errorMessage && (
                <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                    {errorMessage}
                </p>
            )}

            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isPending}
                    className="border-border text-surface-foreground hover:bg-muted min-h-11 cursor-pointer rounded-md border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isPending}
                    className="bg-brand-600 hover:bg-brand-700 inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-md px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <ArrowRightLeft className="size-4" />
                    {isPending ? 'Recording…' : submitLabel}
                </button>
            </div>
        </form>
    );
}
