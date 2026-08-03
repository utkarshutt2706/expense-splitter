import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Receipt } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useCurrentUser } from '@app/hooks';
import type { SplitType, User } from '@data/entities';
import type {
    ExactSplitEntry,
    PercentageSplitEntry,
    SharesSplitEntry,
} from '@features/expenses/utils/splitCalculator';
import { MemberPicker } from '@shared/components';
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

function sumEnteredValues(ids: string[], values: Record<string, string>): number {
    return ids.reduce((sum, id) => {
        const raw = values[id];
        const parsed = raw === undefined || raw === '' ? 0 : Number(raw);
        return sum + (Number.isFinite(parsed) ? parsed : 0);
    }, 0);
}

function formatAmount(value: number): string {
    return `₹${value.toFixed(2)}`;
}

// Trims to at most 2 decimals without trailing zeros, e.g. 25 -> "25", 33.333 -> "33.33".
function formatNumber(value: number): string {
    return Number(value.toFixed(2)).toString();
}

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
    const { data: currentUser } = useCurrentUser();
    const {
        register,
        handleSubmit,
        control,
        watch,
        formState: { errors },
    } = useForm<UpsertExpenseInput>({
        resolver: zodResolver(upsertExpenseSchema),
        defaultValues: {
            description: initialValues?.description ?? '',
            amount: initialValues?.amount,
            paidByUserId: initialValues?.paidByUserId ?? currentUser?.id ?? '',
        },
    });
    const amount = watch('amount');
    const isAmountFilled = typeof amount === 'number' && Number.isFinite(amount) && amount > 0;
    const [participantUserIds, setParticipantUserIds] = useState<string[]>(
        initialValues?.participantUserIds ?? members.map((member) => member.id),
    );
    const [participantsError, setParticipantsError] = useState<string | undefined>();
    const [splitType, setSplitType] = useState<SplitType>(initialValues?.splitType ?? 'equal');
    const [splitValues, setSplitValues] = useState<Record<string, string>>(
        initialValues?.splitValues ?? {},
    );
    const [splitError, setSplitError] = useState<string | undefined>();

    let splitHelperText: string;
    if (splitType === 'exact') {
        const remaining = (amount ?? 0) - sumEnteredValues(participantUserIds, splitValues);
        splitHelperText = `Remaining ${formatAmount(remaining)} of ${formatAmount(amount ?? 0)} expense amount`;
    } else if (splitType === 'percentage') {
        const remaining = 100 - sumEnteredValues(participantUserIds, splitValues);
        splitHelperText = `Remaining ${formatNumber(remaining)} of 100 percent`;
    } else if (splitType === 'shares') {
        const totalShares = Math.round(sumEnteredValues(participantUserIds, splitValues));
        splitHelperText = `Splitting into ${totalShares} share${totalShares === 1 ? '' : 's'} between the selected members`;
    } else {
        splitHelperText = 'Splitting equally between selected members';
    }

    const toggleParticipant = (id: string) => {
        setParticipantUserIds((current) =>
            current.includes(id) ? current.filter((memberId) => memberId !== id) : [...current, id],
        );
    };

    const changeSplitType = (type: SplitType) => {
        if (!isAmountFilled) {
            toast.warning('Enter an amount before choosing how to split it');
            return;
        }
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
                    className="text-surface-foreground text-sm font-medium"
                >
                    Description
                </label>
                <input
                    id="expense-description"
                    type="text"
                    placeholder="What was this expense for?"
                    {...register('description')}
                    className="border-border bg-surface text-surface-foreground focus-visible:ring-brand-500 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                />
                {errors.description && (
                    <p className="text-xs text-red-600">{errors.description.message}</p>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <label
                    htmlFor="expense-amount"
                    className="text-surface-foreground text-sm font-medium"
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
                    className="border-border bg-surface text-surface-foreground focus-visible:ring-brand-500 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                />
                {errors.amount && <p className="text-xs text-red-600">{errors.amount.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-surface-foreground text-sm font-medium">Paid by</span>
                <Controller
                    name="paidByUserId"
                    control={control}
                    render={({ field }) => (
                        <MemberPicker
                            members={members}
                            value={field.value}
                            onChange={field.onChange}
                            ariaLabel="Paid by"
                            placeholder="Select who paid"
                        />
                    )}
                />
                {errors.paidByUserId && (
                    <p className="text-xs text-red-600">{errors.paidByUserId.message}</p>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <span className="text-surface-foreground text-sm font-medium">Split type</span>
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

            <p className="text-muted-foreground text-sm">{splitHelperText}</p>

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
                    {mode === 'add' ? <Receipt className="size-4" /> : <Check className="size-4" />}
                    {mode === 'add' ? 'Add expense' : 'Save changes'}
                </button>
            </div>
        </form>
    );
}
