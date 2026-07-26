import type { User } from '../../lib/storage/models';
import { closeOnSubmit } from '../../shared/closeOnSubmit';
import { FormDialog } from '../../shared/FormDialog';
import { CreateGroupForm, type CreateGroupFormValues } from './CreateGroupForm';

interface CreateGroupDialogProps {
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly friends: User[];
    readonly onSubmit: (values: CreateGroupFormValues) => void;
}

export function CreateGroupDialog({
    open,
    onOpenChange,
    friends,
    onSubmit,
}: CreateGroupDialogProps) {
    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Create a group"
            description="Name your group and choose which friends to include."
        >
            <CreateGroupForm friends={friends} {...closeOnSubmit(onOpenChange, onSubmit)} />
        </FormDialog>
    );
}
