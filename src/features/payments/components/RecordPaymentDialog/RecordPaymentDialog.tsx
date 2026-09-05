import type { User } from '@features/users/api/usersApi';
import { useCurrentUser } from '@app/hooks';
import { FormDialog } from '@shared/components';
import { formatCurrency, participantNameMap } from '@shared/utils';
import { useState } from 'react';
import {
    RecordPaymentForm,
    type RecordPaymentFormInitialValues,
    type RecordPaymentFormValues,
} from '../RecordPaymentForm';

type RecordPaymentDialogProps = Readonly<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    members: User[];
    initialValues?: RecordPaymentFormInitialValues;
    onSubmit: (values: RecordPaymentFormValues) => void;
    mode?: 'create' | 'edit';
    settlementMode?: boolean;
    isPending?: boolean;
    errorMessage?: string;
}>;

export function RecordPaymentDialog({
    open,
    onOpenChange,
    members,
    initialValues,
    onSubmit,
    mode = 'create',
    settlementMode = false,
    isPending = false,
    errorMessage,
}: RecordPaymentDialogProps) {
    const { data: currentUser } = useCurrentUser();
    const [thirdPartyConfirmation, setThirdPartyConfirmation] = useState<RecordPaymentFormValues>();
    const isEditing = mode === 'edit';
    const names = participantNameMap(members, currentUser?.id);
    const memberName = (id: string) => names.get(id) ?? 'a group member';
    let description = 'Record a direct payment between two group members.';
    if (settlementMode && initialValues) {
        description = `Record a settlement from ${memberName(initialValues.fromUserId)} to ${memberName(initialValues.toUserId)}.`;
    } else if (isEditing) {
        description = 'Update the payer, recipient, or amount for this payment.';
    }

    const handleSubmit = (values: RecordPaymentFormValues) => {
        if (isEditing) {
            onOpenChange(false);
            onSubmit(values);
            return;
        }
        const isThirdParty =
            settlementMode &&
            values.fromUserId !== currentUser?.id &&
            values.toUserId !== currentUser?.id;
        if (isThirdParty) {
            setThirdPartyConfirmation(values);
            return;
        }
        onSubmit(values);
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={(nextOpen) => {
                setThirdPartyConfirmation(undefined);
                onOpenChange(nextOpen);
            }}
            title={isEditing ? 'Edit payment' : 'Record a payment'}
            description={description}
            showDescription={settlementMode}
            isPending={isPending}
        >
            {thirdPartyConfirmation ? (
                <div className="flex flex-col gap-4">
                    <p className="text-surface-foreground text-sm">
                        Record that {memberName(thirdPartyConfirmation.fromUserId)} paid{' '}
                        {memberName(thirdPartyConfirmation.toUserId)}{' '}
                        {formatCurrency(thirdPartyConfirmation.amount)}?
                    </p>
                    {errorMessage && (
                        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                            {errorMessage}
                        </p>
                    )}
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            disabled={isPending}
                            onClick={() => setThirdPartyConfirmation(undefined)}
                            className="border-border text-surface-foreground hover:bg-muted min-h-11 cursor-pointer rounded-md border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={isPending}
                            onClick={() => onSubmit(thirdPartyConfirmation)}
                            className="bg-brand-600 hover:bg-brand-700 min-h-11 cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isPending ? 'Recording…' : 'Record payment'}
                        </button>
                    </div>
                </div>
            ) : (
                <RecordPaymentForm
                    members={members}
                    initialValues={initialValues}
                    submitLabel={isEditing ? 'Save changes' : 'Record payment'}
                    lockParticipants={settlementMode}
                    outstandingAmount={settlementMode ? initialValues?.amount : undefined}
                    isPending={isPending}
                    errorMessage={errorMessage}
                    onCancel={() => onOpenChange(false)}
                    onSubmit={handleSubmit}
                />
            )}
        </FormDialog>
    );
}
