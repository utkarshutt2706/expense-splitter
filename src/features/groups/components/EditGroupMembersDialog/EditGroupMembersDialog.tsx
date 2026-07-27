import type { User } from '@data/entities';
import { FormDialog } from '@shared/components';
import { closeOnSubmit } from '@shared/utils';
import { EditGroupMembersForm, type EditGroupMembersFormValues } from '../EditGroupMembersForm';

interface EditGroupMembersDialogProps {
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly users: User[];
    readonly initialMemberIds: string[];
    readonly onSubmit: (values: EditGroupMembersFormValues) => void;
}

export function EditGroupMembersDialog({
    open,
    onOpenChange,
    users,
    initialMemberIds,
    onSubmit,
}: EditGroupMembersDialogProps) {
    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Edit members"
            description="Choose which friends belong to this group."
        >
            <EditGroupMembersForm
                users={users}
                initialMemberIds={initialMemberIds}
                {...closeOnSubmit(onOpenChange, onSubmit)}
            />
        </FormDialog>
    );
}
