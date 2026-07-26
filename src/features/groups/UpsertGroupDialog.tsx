import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { User } from '../../lib/storage/models';
import { UpsertGroupForm, type UpsertGroupFormValues } from './UpsertGroupForm';

interface UpsertGroupDialogProps {
    mode: 'add' | 'edit';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    friends: User[];
    initialValues?: UpsertGroupFormValues;
    onSubmit: (values: UpsertGroupFormValues) => void;
}

export function UpsertGroupDialog({
    mode,
    open,
    onOpenChange,
    friends,
    initialValues,
    onSubmit,
}: UpsertGroupDialogProps) {
    const title = mode === 'add' ? 'Create a group' : 'Edit group';
    const description =
        mode === 'add'
            ? 'Name your group and choose which friends to include.'
            : "Update your group's name and members.";

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-6 shadow-lg">
                    <div className="mb-4 flex items-center justify-between">
                        <Dialog.Title className="font-display text-lg font-medium text-surface-foreground">
                            {title}
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button
                                type="button"
                                aria-label="Close"
                                className="cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-muted"
                            >
                                <X className="size-4" />
                            </button>
                        </Dialog.Close>
                    </div>
                    <Dialog.Description className="sr-only">{description}</Dialog.Description>
                    <UpsertGroupForm
                        mode={mode}
                        friends={friends}
                        initialValues={initialValues}
                        onSubmit={(values) => {
                            onOpenChange(false);
                            onSubmit(values);
                        }}
                        onCancel={() => onOpenChange(false)}
                    />
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
