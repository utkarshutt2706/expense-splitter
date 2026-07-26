import { closeOnSubmit } from '../../shared/closeOnSubmit';
import { FormDialog } from '../../shared/FormDialog';
import { FriendForm, type FriendFormValues } from './FriendForm';

interface UpsertFriendDialogProps {
    readonly mode: 'add' | 'edit';
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly initialValues?: FriendFormValues;
    readonly onSubmit: (values: FriendFormValues) => void;
}

export function UpsertFriendDialog({
    mode,
    open,
    onOpenChange,
    initialValues,
    onSubmit,
}: UpsertFriendDialogProps) {
    const title = mode === 'add' ? 'Add a friend' : 'Edit friend';
    const description =
        mode === 'add'
            ? "Enter your friend's name and email to add them to your friends list."
            : "Update your friend's name and email.";

    return (
        <FormDialog open={open} onOpenChange={onOpenChange} title={title} description={description}>
            <FriendForm
                mode={mode}
                initialValues={initialValues}
                {...closeOnSubmit(onOpenChange, onSubmit)}
            />
        </FormDialog>
    );
}
