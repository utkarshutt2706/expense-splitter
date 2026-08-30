import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

type FormDialogProps = Readonly<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: ReactNode;
    children: ReactNode;
    showDescription?: boolean;
    isPending?: boolean;
}>;

export function FormDialog({
    open,
    onOpenChange,
    title,
    description,
    children,
    showDescription = false,
    isPending = false,
}: FormDialogProps) {
    return (
        <Dialog.Root
            open={open}
            onOpenChange={(nextOpen) => {
                if (!isPending) onOpenChange(nextOpen);
            }}
        >
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
                <Dialog.Content
                    onEscapeKeyDown={(event) => {
                        if (isPending) event.preventDefault();
                    }}
                    className="border-border bg-surface fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border p-5 shadow-lg sm:p-6"
                >
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <Dialog.Title className="text-surface-foreground min-w-0 text-lg font-medium">
                            {title}
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button
                                type="button"
                                aria-label="Close"
                                disabled={isPending}
                                className="text-muted-foreground hover:bg-muted cursor-pointer items-center justify-center rounded-md p-1 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <X aria-hidden="true" className="size-4" />
                            </button>
                        </Dialog.Close>
                    </div>
                    <Dialog.Description
                        className={
                            showDescription ? 'text-muted-foreground mb-4 text-sm' : 'sr-only'
                        }
                    >
                        {description}
                    </Dialog.Description>
                    {children}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
