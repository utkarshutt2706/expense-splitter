import { zodResolver } from '@hookform/resolvers/zod';
import { Receipt } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type { User } from '@data/entities';
import { MemberCheckboxList } from '@features/groups';

const addExpenseSchema = z.object({
    description: z.string().trim().min(1, 'Description is required'),
    amount: z
        .number({
            error: 'Amount is required',
        })
        .positive('Amount must be greater than zero'),
});

type AddExpenseInput = z.infer<typeof addExpenseSchema>;

export interface AddExpenseFormValues {
    description: string;
    amount: number;
    participantUserIds: string[];
}

interface AddExpenseFormProps {
    readonly members: User[];
    readonly onSubmit: (values: AddExpenseFormValues) => void;
    readonly onCancel: () => void;
}

export function AddExpenseForm({ members, onSubmit, onCancel }: AddExpenseFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AddExpenseInput>({ resolver: zodResolver(addExpenseSchema) });
    const [participantUserIds, setParticipantUserIds] = useState<string[]>(
        members.map((member) => member.id),
    );
    const [participantsError, setParticipantsError] = useState<string | undefined>();

    const toggleParticipant = (id: string) => {
        setParticipantUserIds((current) =>
            current.includes(id) ? current.filter((memberId) => memberId !== id) : [...current, id],
        );
    };

    const submit = handleSubmit((values) => {
        if (participantUserIds.length === 0) {
            setParticipantsError('Select at least one participant');
            return;
        }

        setParticipantsError(undefined);
        onSubmit({
            description: values.description,
            amount: values.amount,
            participantUserIds,
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
                    placeholder="0.00"
                    {...register('amount', { valueAsNumber: true })}
                    className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-surface-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                />
                {errors.amount && <p className="text-xs text-red-600">{errors.amount.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-surface-foreground">
                    Split equally between
                </span>
                <MemberCheckboxList
                    users={members}
                    selectedIds={participantUserIds}
                    onToggle={toggleParticipant}
                    emptyMessage="This group has no members to split with."
                />
                {participantsError && <p className="text-xs text-red-600">{participantsError}</p>}
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
                    <Receipt className="size-4" />
                    Add expense
                </button>
            </div>
        </form>
    );
}
