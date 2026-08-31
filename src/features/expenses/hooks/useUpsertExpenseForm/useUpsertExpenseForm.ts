import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useCurrentUser } from '@app/hooks';
import type { SplitType } from '@features/expenses/api/expensesApi';
import { getSplitAllocationPreview } from '@features/expenses/utils';
import type {
    ExactSplitEntry,
    PercentageSplitEntry,
    SharesSplitEntry,
} from '@features/expenses/utils/splitCalculator';
import type { User } from '@features/users/api/usersApi';
import { localDateInputValue, normalizeDateInputValue } from '@shared/utils';

const upsertExpenseSchema = z.object({
    description: z.string().trim().min(1, 'Description is required'),
    amount: z.number({ error: 'Amount is required' }).positive('Amount must be greater than zero'),
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

export type UseUpsertExpenseFormOptions = Readonly<{
    members: User[];
    initialValues?: UpsertExpenseFormInitialValues;
    onSubmit: (values: UpsertExpenseFormValues) => void;
}>;

const PERCENTAGE_TOLERANCE = 0.01;

export function useUpsertExpenseForm({
    members,
    initialValues,
    onSubmit,
}: UseUpsertExpenseFormOptions) {
    const { data: currentUser } = useCurrentUser();
    const defaultPaidOn = useMemo(() => new Date(), []);
    const form = useForm<UpsertExpenseInput>({
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
    const amount = useWatch({ control: form.control, name: 'amount' });
    const isAmountFilled = typeof amount === 'number' && Number.isFinite(amount) && amount > 0;
    const [participantUserIds, setParticipantUserIds] = useState<string[]>(
        initialValues?.participantUserIds ?? members.map((member) => member.id),
    );
    const [participantsError, setParticipantsError] = useState<string>();
    const [splitType, setSplitType] = useState<SplitType>(initialValues?.splitType ?? 'equal');
    const [splitValues, setSplitValues] = useState<Record<string, string>>(
        initialValues?.splitValues ?? {},
    );
    const [splitError, setSplitError] = useState<string>();

    const allocationPreview = getSplitAllocationPreview({
        amount,
        participantUserIds,
        splitType,
        splitValues,
    });

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

    const parseValues = (label: string): { userId: string; value: number }[] | undefined => {
        const parsedValues = participantUserIds.map((userId) => ({
            userId,
            value: Number(splitValues[userId] ?? Number.NaN),
        }));
        if (parsedValues.some(({ value }) => !Number.isFinite(value) || value <= 0)) {
            setSplitError(`Enter ${label} for every participant`);
            return undefined;
        }
        return parsedValues;
    };

    const submit = form.handleSubmit((values) => {
        if (participantUserIds.length === 0) {
            setParticipantsError('Select at least one participant');
            return;
        }
        setParticipantsError(undefined);
        const baseValues = { ...values, participantUserIds };

        if (splitType === 'exact') {
            const parsed = parseValues('an amount');
            if (!parsed) return;
            if (
                parsed.reduce((sum, entry) => sum + Math.round(entry.value * 100), 0) !==
                Math.round(values.amount * 100)
            ) {
                setSplitError('Exact amounts must add up to the total expense amount');
                return;
            }
            setSplitError(undefined);
            onSubmit({
                ...baseValues,
                splitType,
                exactSplits: parsed.map(({ userId, value }) => ({ userId, amount: value })),
            });
            return;
        }

        if (splitType === 'percentage') {
            const parsed = parseValues('a percentage');
            if (!parsed) return;
            if (
                Math.abs(parsed.reduce((sum, entry) => sum + entry.value, 0) - 100) >
                PERCENTAGE_TOLERANCE
            ) {
                setSplitError('Split percentages must add up to 100');
                return;
            }
            setSplitError(undefined);
            onSubmit({
                ...baseValues,
                splitType,
                percentageSplits: parsed.map(({ userId, value }) => ({
                    userId,
                    percentage: value,
                })),
            });
            return;
        }

        if (splitType === 'shares') {
            const parsed = parseValues('a share count');
            if (!parsed) return;
            setSplitError(undefined);
            onSubmit({
                ...baseValues,
                splitType,
                sharesSplits: parsed.map(({ userId, value }) => ({ userId, shares: value })),
            });
            return;
        }

        setSplitError(undefined);
        onSubmit({ ...baseValues, splitType: 'equal' });
    });

    return {
        ...form,
        allocationPreview,
        changeSplitType,
        changeSplitValue,
        defaultPaidOn,
        participantUserIds,
        participantsError,
        splitError,
        splitType,
        splitValues,
        submit,
        toggleParticipant,
    };
}
