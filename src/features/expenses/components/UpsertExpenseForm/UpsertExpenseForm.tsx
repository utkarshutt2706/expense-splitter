import { Check, Receipt } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { toast } from 'sonner';

import {
    useUpsertExpenseForm,
    type UpsertExpenseFormInitialValues,
    type UpsertExpenseFormValues,
} from '@features/expenses/hooks/useUpsertExpenseForm';
import type { User } from '@features/users/api/usersApi';
import { CurrencyInput, MemberPicker } from '@shared/components';
import { localDateInputValue, openDatePicker } from '@shared/utils';
import { SplitParticipantList } from '../SplitParticipantList';
import { SplitTypeTabs } from '../SplitTypeTabs';

export type { UpsertExpenseFormInitialValues, UpsertExpenseFormValues };

export type UpsertExpenseFormProps = Readonly<{
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
    const {
        register,
        control,
        formState: { errors },
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
    } = useUpsertExpenseForm({ members, initialValues, onSubmit });

    let allocationSummaryClass = 'text-muted-foreground text-sm';
    if (allocationPreview.status === 'invalid') allocationSummaryClass = 'text-sm text-red-600';
    if (allocationPreview.status === 'valid') {
        allocationSummaryClass = 'text-sm text-green-700 dark:text-green-400';
    }

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
                <SplitTypeTabs
                    value={splitType}
                    onChange={(type) => {
                        if (!changeSplitType(type)) {
                            toast.warning('Enter an amount before choosing how to split it');
                        }
                    }}
                />
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
