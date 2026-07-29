import type { User } from '@data/entities';
import { FormDialog } from '@shared/components';
import { closeOnSubmit } from '@shared/utils';
import {
    UpsertExpenseForm,
    type UpsertExpenseFormInitialValues,
    type UpsertExpenseFormValues,
} from '../UpsertExpenseForm';

interface UpsertExpenseDialogProps {
    readonly mode?: 'add' | 'edit';
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly members: User[];
    readonly initialValues?: UpsertExpenseFormInitialValues;
    readonly onSubmit: (values: UpsertExpenseFormValues) => void;
}

export function UpsertExpenseDialog({
    mode = 'add',
    open,
    onOpenChange,
    members,
    initialValues,
    onSubmit,
}: UpsertExpenseDialogProps) {
    const title = mode === 'add' ? 'Add an expense' : 'Edit expense';
    const description =
        mode === 'add'
            ? 'Record a new expense and split it among participants.'
            : "Update this expense's details and how it's split.";

    return (
        <FormDialog open={open} onOpenChange={onOpenChange} title={title} description={description}>
            <UpsertExpenseForm
                mode={mode}
                members={members}
                initialValues={initialValues}
                {...closeOnSubmit(onOpenChange, onSubmit)}
            />
        </FormDialog>
    );
}
