import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { useCurrentUser } from '@app/hooks';
import type { SplitType } from '@features/expenses/api/expensesApi';
import { getSplitAllocationPreview } from '@features/expenses/utils';
import { validateSplitInput } from '@features/expenses/utils/expenseSplitInput';
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
        if (!isAmountFilled) return false;
        setSplitType(type);
        setSplitValues({});
        setSplitError(undefined);
        return true;
    };

    const changeSplitValue = (id: string, value: string) => {
        setSplitValues((current) => ({ ...current, [id]: value }));
    };

    const submit = form.handleSubmit((values) => {
        if (participantUserIds.length === 0) {
            setParticipantsError('Select at least one participant');
            return;
        }
        setParticipantsError(undefined);
        const baseValues = { ...values, participantUserIds };
        const validation = validateSplitInput(
            splitType,
            values.amount,
            participantUserIds,
            splitValues,
        );
        if (validation.error) {
            setSplitError(validation.error);
            return;
        }
        const parsed = validation.values ?? [];
        setSplitError(undefined);

        if (splitType === 'exact') {
            onSubmit({
                ...baseValues,
                splitType,
                exactSplits: parsed.map(({ userId, value }) => ({ userId, amount: value })),
            });
            return;
        }

        if (splitType === 'percentage') {
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
            onSubmit({
                ...baseValues,
                splitType,
                sharesSplits: parsed.map(({ userId, value }) => ({ userId, shares: value })),
            });
            return;
        }

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
