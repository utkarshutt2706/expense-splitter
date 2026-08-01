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
}

export function RecordPaymentDialog({
    open,
    onOpenChange,
    members,
    initialValues,
    onSubmit,
}: RecordPaymentDialogProps) {
    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Record a payment"
            description="Record a direct payment between two group members."
        >
            <RecordPaymentForm
                members={members}
                initialValues={initialValues}
                {...closeOnSubmit(onOpenChange, onSubmit)}
            />
        </FormDialog>
    );
}
