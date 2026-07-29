import type { User } from '@data/entities';
import { FormDialog } from '@shared/components';
import { closeOnSubmit } from '@shared/utils';
import { AddExpenseForm, type AddExpenseFormValues } from '../AddExpenseForm';

interface AddExpenseDialogProps {
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly members: User[];
    readonly onSubmit: (values: AddExpenseFormValues) => void;
}

export function AddExpenseDialog({ open, onOpenChange, members, onSubmit }: AddExpenseDialogProps) {
    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Add an expense"
            description="Record a new expense and split it among participants."
        >
            <AddExpenseForm members={members} {...closeOnSubmit(onOpenChange, onSubmit)} />
        </FormDialog>
    );
}
