export function closeOnSubmit<T>(
    onOpenChange: (open: boolean) => void,
    onSubmit: (values: T) => void,
): { onSubmit: (values: T) => void; onCancel: () => void } {
    return {
        onSubmit: (values: T) => {
            onOpenChange(false);
            onSubmit(values);
        },
        onCancel: () => onOpenChange(false),
    };
}
