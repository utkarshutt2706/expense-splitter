import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    children: ReactNode;
}

export function FormDialog({ open, onOpenChange, title, description, children }: FormDialogProps) {
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
                    {children}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
