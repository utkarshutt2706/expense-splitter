import type { User } from '@data/entities';
import { FormDialog } from '@shared/components';
import { closeOnSubmit } from '@shared/utils';
import {
    RecordPaymentForm,
    type RecordPaymentFormInitialValues,
    type RecordPaymentFormValues,
} from '../RecordPaymentForm';

interface RecordPaymentDialogProps {
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly members: User[];
    readonly initialValues?: RecordPaymentFormInitialValues;
    readonly onSubmit: (values: RecordPaymentFormValues) => void;
    readonly mode?: 'create' | 'edit';
}

export function RecordPaymentDialog({
    open,
    onOpenChange,
    members,
    initialValues,
    onSubmit,
    mode = 'create',
}: RecordPaymentDialogProps) {
    const isEditing = mode === 'edit';

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={isEditing ? 'Edit payment' : 'Record a payment'}
            description={
                isEditing
                    ? 'Update the payer, recipient, or amount for this payment.'
                    : 'Record a direct payment between two group members.'
            }
        >
            <RecordPaymentForm
                members={members}
                initialValues={initialValues}
                submitLabel={isEditing ? 'Save changes' : 'Record payment'}
                {...closeOnSubmit(onOpenChange, onSubmit)}
            />
        </FormDialog>
    );
}
