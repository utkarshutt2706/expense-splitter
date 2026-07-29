import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Receipt } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import type { SplitType, User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import type {
    ExactSplitEntry,
    PercentageSplitEntry,
    SharesSplitEntry,
} from '@features/expenses/utils/splitCalculator';
import { PaidByPicker } from '../PaidByPicker';
import { SplitParticipantList } from '../SplitParticipantList';
import { SplitTypeTabs } from '../SplitTypeTabs';

const upsertExpenseSchema = z.object({
    description: z.string().trim().min(1, 'Description is required'),
    amount: z
        .number({
            error: 'Amount is required',
        })
        .positive('Amount must be greater than zero'),
    paidByUserId: z.string().min(1, 'Select who paid'),
});

type UpsertExpenseInput = z.infer<typeof upsertExpenseSchema>;

const PERCENTAGE_TOLERANCE = 0.01;

export interface UpsertExpenseFormValues {
    description: string;
    amount: number;
    paidByUserId: string;
    participantUserIds: string[];
    splitType: SplitType;
    exactSplits?: ExactSplitEntry[];
    percentageSplits?: PercentageSplitEntry[];
    sharesSplits?: SharesSplitEntry[];
}

export interface UpsertExpenseFormInitialValues {
    description: string;
    amount: number;
    paidByUserId: string;
    participantUserIds: string[];
    splitType: SplitType;
    splitValues: Record<string, string>;
}

interface UpsertExpenseFormProps {
    readonly mode?: 'add' | 'edit';
    readonly members: User[];
    readonly initialValues?: UpsertExpenseFormInitialValues;
    readonly onSubmit: (values: UpsertExpenseFormValues) => void;
    readonly onCancel: () => void;
}

export function UpsertExpenseForm({
    mode = 'add',
    members,
    initialValues,
    onSubmit,
    onCancel,
}: UpsertExpenseFormProps) {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<UpsertExpenseInput>({
        resolver: zodResolver(upsertExpenseSchema),
        defaultValues: {
            description: initialValues?.description ?? '',
            amount: initialValues?.amount,
            paidByUserId: initialValues?.paidByUserId ?? CURRENT_USER_ID,
        },
    });
    const [participantUserIds, setParticipantUserIds] = useState<string[]>(
        initialValues?.participantUserIds ?? members.map((member) => member.id),
    );
    const [participantsError, setParticipantsError] = useState<string | undefined>();
    const [splitType, setSplitType] = useState<SplitType>(initialValues?.splitType ?? 'equal');
    const [splitValues, setSplitValues] = useState<Record<string, string>>(
        initialValues?.splitValues ?? {},
    );
    const [splitError, setSplitError] = useState<string | undefined>();

    const toggleParticipant = (id: string) => {
        setParticipantUserIds((current) =>
            current.includes(id) ? current.filter((memberId) => memberId !== id) : [...current, id],
        );
    };

    const changeSplitType = (type: SplitType) => {
        setSplitType(type);
        setSplitValues({});
        setSplitError(undefined);
    };

    const changeSplitValue = (id: string, value: string) => {
        setSplitValues((current) => ({ ...current, [id]: value }));
    };

    const buildExactSplits = (amount: number): ExactSplitEntry[] | undefined => {
        const totalCents = Math.round(amount * 100);
        let sumCents = 0;
        const exactSplits: ExactSplitEntry[] = [];

        for (const userId of participantUserIds) {
            const raw = splitValues[userId];
            const parsed = raw === undefined || raw === '' ? Number.NaN : Number(raw);
            if (!Number.isFinite(parsed) || parsed <= 0) {
                setSplitError('Enter an amount for every participant');
                return undefined;
            }
            sumCents += Math.round(parsed * 100);
            exactSplits.push({ userId, amount: parsed });
        }

        if (sumCents !== totalCents) {
            setSplitError('Exact amounts must add up to the total expense amount');
            return undefined;
        }

        return exactSplits;
    };

    const buildPercentageSplits = (): PercentageSplitEntry[] | undefined => {
        let sumPercentage = 0;
        const percentageSplits: PercentageSplitEntry[] = [];

        for (const userId of participantUserIds) {
            const raw = splitValues[userId];
            const parsed = raw === undefined || raw === '' ? Number.NaN : Number(raw);
            if (!Number.isFinite(parsed) || parsed <= 0) {
                setSplitError('Enter a percentage for every participant');
                return undefined;
            }
            sumPercentage += parsed;
            percentageSplits.push({ userId, percentage: parsed });
        }

        if (Math.abs(sumPercentage - 100) > PERCENTAGE_TOLERANCE) {
            setSplitError('Split percentages must add up to 100');
            return undefined;
        }

        return percentageSplits;
    };

    const buildSharesSplits = (): SharesSplitEntry[] | undefined => {
        const sharesSplits: SharesSplitEntry[] = [];

        for (const userId of participantUserIds) {
            const raw = splitValues[userId];
            const parsed = raw === undefined || raw === '' ? Number.NaN : Number(raw);
            if (!Number.isFinite(parsed) || parsed <= 0) {
                setSplitError('Enter a share count for every participant');
                return undefined;
            }
            sharesSplits.push({ userId, shares: parsed });
        }

        return sharesSplits;
    };

    const submit = handleSubmit((values) => {
        if (participantUserIds.length === 0) {
            setParticipantsError('Select at least one participant');
            return;
        }
        setParticipantsError(undefined);

        if (splitType === 'exact') {
            const exactSplits = buildExactSplits(values.amount);
            if (!exactSplits) return;

            setSplitError(undefined);
            onSubmit({
                description: values.description,
                amount: values.amount,
                paidByUserId: values.paidByUserId,
                participantUserIds,
                splitType: 'exact',
                exactSplits,
            });
            return;
        }

        if (splitType === 'percentage') {
            const percentageSplits = buildPercentageSplits();
            if (!percentageSplits) return;

            setSplitError(undefined);
            onSubmit({
                description: values.description,
                amount: values.amount,
                paidByUserId: values.paidByUserId,
                participantUserIds,
                splitType: 'percentage',
                percentageSplits,
            });
            return;
        }

        if (splitType === 'shares') {
            const sharesSplits = buildSharesSplits();
            if (!sharesSplits) return;

            setSplitError(undefined);
            onSubmit({
                description: values.description,
                amount: values.amount,
                paidByUserId: values.paidByUserId,
                participantUserIds,
                splitType: 'shares',
                sharesSplits,
            });
            return;
        }

        setSplitError(undefined);
        onSubmit({
            description: values.description,
            amount: values.amount,
            paidByUserId: values.paidByUserId,
            participantUserIds,
            splitType: 'equal',
        });
    });

    return (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <label
                    htmlFor="expense-description"
                    className="text-sm font-medium text-surface-foreground"
                >
                    Description
                </label>
                <input
                    id="expense-description"
                    type="text"
                    placeholder="What was this expense for?"
                    {...register('description')}
                    className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-surface-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                />
                {errors.description && (
                    <p className="text-xs text-red-600">{errors.description.message}</p>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <label
                    htmlFor="expense-amount"
                    className="text-sm font-medium text-surface-foreground"
                >
                    Amount
                </label>
                <input
                    id="expense-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="₹0.00"
                    {...register('amount', { valueAsNumber: true })}
                    className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-surface-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                />
                {errors.amount && <p className="text-xs text-red-600">{errors.amount.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-surface-foreground">Paid by</span>
                <Controller
                    name="paidByUserId"
                    control={control}
                    render={({ field }) => (
                        <PaidByPicker
                            members={members}
                            value={field.value}
                            onChange={field.onChange}
                        />
                    )}
                />
                {errors.paidByUserId && (
                    <p className="text-xs text-red-600">{errors.paidByUserId.message}</p>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-surface-foreground">Split</span>
                <SplitTypeTabs value={splitType} onChange={changeSplitType} />
                <SplitParticipantList
                    users={members}
                    splitType={splitType}
                    selectedIds={participantUserIds}
                    onToggle={toggleParticipant}
                    values={splitValues}
                    onValueChange={changeSplitValue}
                    emptyMessage="This group has no members to split with."
                />
                {participantsError && <p className="text-xs text-red-600">{participantsError}</p>}
                {splitError && <p className="text-xs text-red-600">{splitError}</p>}
            </div>

            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="cursor-pointer rounded-md border border-border px-4 py-2 text-sm font-medium text-surface-foreground hover:bg-muted"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                    {mode === 'add' ? <Receipt className="size-4" /> : <Check className="size-4" />}
                    {mode === 'add' ? 'Add expense' : 'Save changes'}
                </button>
            </div>
        </form>
    );
}
