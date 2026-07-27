import type { User } from '@data/entities';
import { FormDialog } from '@shared/components';
import { closeOnSubmit } from '@shared/utils';
import { CreateGroupForm, type CreateGroupFormValues } from '../CreateGroupForm';

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
