import * as AlertDialog from '@radix-ui/react-alert-dialog';
import type { ReactNode } from 'react';
import { useRef } from 'react';

type ConfirmationDialogProps = Readonly<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: ReactNode;
    confirmLabel: string;
    onConfirm: () => void;
    destructive?: boolean;
    isPending?: boolean;
    pendingLabel?: string;
    errorMessage?: string;
}>;

export function ConfirmationDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel,
    onConfirm,
    destructive = false,
    isPending = false,
    pendingLabel = 'Working…',
    errorMessage,
}: ConfirmationDialogProps) {
    const cancelButtonRef = useRef<HTMLButtonElement>(null);

    return (
        <AlertDialog.Root
            open={open}
            onOpenChange={(nextOpen) => {
                if (!isPending) onOpenChange(nextOpen);
            }}
        >
            <AlertDialog.Portal>
                <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
                <AlertDialog.Content
                    onEscapeKeyDown={(event) => {
                        if (isPending) event.preventDefault();
                    }}
                    onOpenAutoFocus={(event) => {
                        event.preventDefault();
                        cancelButtonRef.current?.focus();
                    }}
                    className="border-border bg-surface fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border p-5 shadow-lg sm:p-6"
                >
                    <AlertDialog.Title className="text-surface-foreground text-lg font-medium">
                        {title}
                    </AlertDialog.Title>
                    <AlertDialog.Description className="text-muted-foreground mt-2 text-sm">
                        {description}
                    </AlertDialog.Description>
                    {errorMessage && (
                        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
                            {errorMessage}
                        </p>
                    )}
                    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <AlertDialog.Cancel asChild>
                            <button
                                ref={cancelButtonRef}
                                type="button"
                                disabled={isPending}
                                className="border-border text-surface-foreground hover:bg-muted min-h-11 cursor-pointer rounded-md border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Cancel
                            </button>
                        </AlertDialog.Cancel>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isPending}
                            aria-busy={isPending}
                            className={
                                destructive
                                    ? 'min-h-11 cursor-pointer rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60'
                                    : 'bg-brand-600 hover:bg-brand-700 min-h-11 cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60'
                            }
                        >
                            {isPending ? pendingLabel : confirmLabel}
                        </button>
                    </div>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    );
}
