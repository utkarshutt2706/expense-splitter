import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { FriendForm, type FriendFormValues } from './FriendForm';

interface UpsertFriendDialogProps {
    mode: 'add' | 'edit';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialValues?: FriendFormValues;
    onSubmit: (values: FriendFormValues) => void;
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
                    <FriendForm
                        mode={mode}
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
