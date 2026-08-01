import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface FormDialogProps {
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly title: string;
    readonly description: string;
    readonly children: ReactNode;
}

export function FormDialog({ open, onOpenChange, title, description, children }: FormDialogProps) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
                <Dialog.Content className="border-border bg-surface fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border p-6 shadow-lg">
                    <div className="mb-4 flex items-center justify-between">
                        <Dialog.Title className="font-display text-surface-foreground text-lg font-medium">
                            {title}
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button
                                type="button"
                                aria-label="Close"
                                className="text-muted-foreground hover:bg-muted cursor-pointer rounded-md p-1"
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
