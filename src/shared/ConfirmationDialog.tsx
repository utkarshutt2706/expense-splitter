import * as AlertDialog from '@radix-ui/react-alert-dialog';

interface ConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
    destructive?: boolean;
}

export function ConfirmationDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel,
    onConfirm,
    destructive = false,
}: ConfirmationDialogProps) {
    return (
        <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
            <AlertDialog.Portal>
                <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
                <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-6 shadow-lg">
                    <AlertDialog.Title className="font-display text-lg font-medium text-surface-foreground">
                        {title}
                    </AlertDialog.Title>
                    <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
                        {description}
                    </AlertDialog.Description>
                    <div className="mt-6 flex justify-end gap-2">
                        <AlertDialog.Cancel asChild>
                            <button
                                type="button"
                                className="cursor-pointer rounded-md border border-border px-4 py-2 text-sm font-medium text-surface-foreground hover:bg-muted"
                            >
                                Cancel
                            </button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                            <button
                                type="button"
                                onClick={onConfirm}
                                className={
                                    destructive
                                        ? 'cursor-pointer rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700'
                                        : 'cursor-pointer rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700'
                                }
                            >
                                {confirmLabel}
                            </button>
                        </AlertDialog.Action>
                    </div>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    );
}
