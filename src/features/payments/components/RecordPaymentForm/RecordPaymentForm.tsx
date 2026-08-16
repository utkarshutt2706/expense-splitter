import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRightLeft } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { useCurrentUser } from '@app/hooks';
import type { User } from '@data/entities';
import { MemberPicker } from '@shared/components';

const recordPaymentSchema = z
    .object({
        fromUserId: z.string().min(1, 'Select who paid'),
        toUserId: z.string().min(1, 'Select who received it'),
        amount: z
            .number({
                error: 'Amount is required',
            })
            .positive('Amount must be greater than zero'),
    })
    .refine((values) => values.fromUserId !== values.toUserId, {
        message: 'Choose two different people',
        path: ['toUserId'],
    });

export interface RecordPaymentFormValues {
    fromUserId: string;
    toUserId: string;
    amount: number;
}

export interface RecordPaymentFormInitialValues {
    fromUserId: string;
    toUserId: string;
    amount: number;
}

interface RecordPaymentFormProps {
    readonly members: User[];
    readonly initialValues?: RecordPaymentFormInitialValues;
    readonly onSubmit: (values: RecordPaymentFormValues) => void;
    readonly onCancel: () => void;
    readonly submitLabel?: string;
}

export function RecordPaymentForm({
    members,
    initialValues,
    onSubmit,
    onCancel,
    submitLabel = 'Record payment',
}: RecordPaymentFormProps) {
    const { data: currentUser } = useCurrentUser();
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<RecordPaymentFormValues>({
        resolver: zodResolver(recordPaymentSchema),
        defaultValues: {
            fromUserId: initialValues?.fromUserId ?? currentUser?.id ?? '',
            toUserId: initialValues?.toUserId ?? '',
            amount: initialValues?.amount,
        },
    });

    const submit = handleSubmit((values) => onSubmit(values));

    return (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <span className="text-surface-foreground text-sm font-medium">From</span>
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
                {errors.fromUserId && (
                    <p className="text-xs text-red-600">{errors.fromUserId.message}</p>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-surface-foreground text-sm font-medium">To</span>
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
                {errors.toUserId && (
                    <p className="text-xs text-red-600">{errors.toUserId.message}</p>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <label
                    htmlFor="payment-amount"
                    className="text-surface-foreground text-sm font-medium"
                >
                    Amount
                </label>
                <input
                    id="payment-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="₹0.00"
                    {...register('amount', { valueAsNumber: true })}
                    className="border-border bg-surface text-surface-foreground focus-visible:ring-brand-500 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                />
                {errors.amount && <p className="text-xs text-red-600">{errors.amount.message}</p>}
            </div>

            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="border-border text-surface-foreground hover:bg-muted cursor-pointer rounded-md border px-4 py-2 text-sm font-medium"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="bg-brand-600 hover:bg-brand-700 inline-flex cursor-pointer items-center gap-1 rounded-md px-4 py-2 text-sm font-medium text-white"
                >
                    <ArrowRightLeft className="size-4" />
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}
