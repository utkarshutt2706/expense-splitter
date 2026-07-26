import * as Dialog from '@radix-ui/react-dialog';
import { UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import { AddFriendForm, type AddFriendFormValues } from './AddFriendForm';

interface AddFriendDialogProps {
    onSubmit: (values: AddFriendFormValues) => void;
}

export function AddFriendDialog({ onSubmit }: AddFriendDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                <button
                    type="button"
                    className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-surface-foreground hover:bg-muted"
                >
                    <UserPlus className="size-4" />
                    Add friend
                </button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-6 shadow-lg">
                    <div className="mb-4 flex items-center justify-between">
                        <Dialog.Title className="font-display text-lg font-medium text-surface-foreground">
                            Add a friend
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
                    <Dialog.Description className="sr-only">
                        Enter your friend's name and email to add them to your friends list.
                    </Dialog.Description>
                    <AddFriendForm
                        onSubmit={(values) => {
                            setOpen(false);
                            onSubmit(values);
                        }}
                        onCancel={() => setOpen(false)}
                    />
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
