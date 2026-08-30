import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Receipt } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useCurrentUser } from '@app/hooks';
import type { SplitType } from '@features/expenses/api/expensesApi';
import type { User } from '@features/users/api/usersApi';
import type {
    ExactSplitEntry,
    PercentageSplitEntry,
    SharesSplitEntry,
} from '@features/expenses/utils/splitCalculator';
import { getSplitAllocationPreview } from '@features/expenses/utils';
import { CurrencyInput, MemberPicker } from '@shared/components';
import { localDateInputValue, normalizeDateInputValue, openDatePicker } from '@shared/utils';
import { SplitParticipantList } from '../SplitParticipantList';
import { SplitTypeTabs } from '../SplitTypeTabs';

const upsertExpenseSchema = z.object({
    description: z.string().trim().min(1, 'Description is required'),
    amount: z
        .number({
            error: 'Amount is required',
        })
        .positive('Amount must be greater than zero'),
    paidOn: z
        .string()
        .min(1, 'Paid date is required')
        .refine(
            (value) => value <= localDateInputValue(new Date()),
            'Paid date cannot be in the future',
        ),
    paidByUserId: z.string().min(1, 'Select who paid'),
});

type UpsertExpenseInput = z.infer<typeof upsertExpenseSchema>;

const PERCENTAGE_TOLERANCE = 0.01;

export interface UpsertExpenseFormValues {
    description: string;
    amount: number;
    paidByUserId: string;
    paidOn: string;
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
    paidOn?: string;
    participantUserIds: string[];
    splitType: SplitType;
    splitValues: Record<string, string>;
}

type UpsertExpenseFormProps = Readonly<{
    mode?: 'add' | 'edit';
    members: User[];
    initialValues?: UpsertExpenseFormInitialValues;
    onSubmit: (values: UpsertExpenseFormValues) => void;
    onCancel: () => void;
}>;

export function UpsertExpenseForm({
    mode = 'add',
    members,
    initialValues,
    onSubmit,
    onCancel,
}: UpsertExpenseFormProps) {
    const { data: currentUser } = useCurrentUser();
    const defaultPaidOn = useMemo(() => new Date(), []);
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
            paidOn:
                normalizeDateInputValue(initialValues?.paidOn) ??
                localDateInputValue(defaultPaidOn),
            paidByUserId: initialValues?.paidByUserId ?? currentUser?.id ?? '',
        },
    });
    const amount = useWatch({ control, name: 'amount' });
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

    const allocationPreview = getSplitAllocationPreview({
        amount,
        participantUserIds,
        splitType,
        splitValues,
    });
    let allocationSummaryClass = 'text-muted-foreground text-sm';
    if (allocationPreview.status === 'invalid') allocationSummaryClass = 'text-sm text-red-600';
    if (allocationPreview.status === 'valid') {
        allocationSummaryClass = 'text-sm text-green-700 dark:text-green-400';
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
                paidOn: values.paidOn,
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
                paidOn: values.paidOn,
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
                paidOn: values.paidOn,
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
            paidOn: values.paidOn,
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
                <span id="expense-currency-description" className="sr-only">
                    Enter the amount in rupees.
                </span>
                <CurrencyInput
                    id="expense-amount"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    aria-invalid={errors.amount ? 'true' : undefined}
                    aria-describedby={
                        errors.amount
                            ? 'expense-currency-description expense-amount-error'
                            : 'expense-currency-description'
                    }
                    {...register('amount', { valueAsNumber: true })}
                />
                {errors.amount && (
                    <p id="expense-amount-error" className="text-xs text-red-600">
                        {errors.amount.message}
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <label
                    htmlFor="expense-paid-on"
                    className="text-surface-foreground text-sm font-medium"
                >
                    Paid on
                </label>
                <input
                    id="expense-paid-on"
                    type="date"
                    max={localDateInputValue(defaultPaidOn)}
                    onClick={(event) => openDatePicker(event.currentTarget)}
                    {...register('paidOn')}
                    className="border-border bg-surface text-surface-foreground focus-visible:ring-brand-500 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                />
                {errors.paidOn && <p className="text-xs text-red-600">{errors.paidOn.message}</p>}
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

            <div
                className="flex flex-col gap-2"
                aria-describedby="split-allocation-summary"
                aria-invalid={participantsError ? 'true' : undefined}
            >
                <span className="text-surface-foreground text-sm font-medium">Split type</span>
                <SplitTypeTabs value={splitType} onChange={changeSplitType} />
                <SplitParticipantList
                    users={members}
                    splitType={splitType}
                    selectedIds={participantUserIds}
                    onToggle={toggleParticipant}
                    values={splitValues}
                    onValueChange={changeSplitValue}
                    resolvedAmounts={allocationPreview.resolvedAmounts}
                    emptyMessage="This group has no members to split with."
                />
                {splitError && <p className="text-xs text-red-600">{splitError}</p>}
                <p
                    id="split-allocation-summary"
                    aria-live="polite"
                    className={allocationSummaryClass}
                >
                    {allocationPreview.summary}
                </p>
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
                    {mode === 'add' ? <Receipt className="size-4" /> : <Check className="size-4" />}
                    {mode === 'add' ? 'Add expense' : 'Save changes'}
                </button>
            </div>
        </form>
    );
}
