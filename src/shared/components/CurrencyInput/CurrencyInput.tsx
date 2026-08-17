import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cn } from '@shared/utils';

interface CurrencyInputProps extends ComponentPropsWithoutRef<'input'> {
    readonly containerClassName?: string;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
    function CurrencyInput({ className, containerClassName, disabled, readOnly, ...props }, ref) {
        const invalid = props['aria-invalid'] === true || props['aria-invalid'] === 'true';

        return (
            <div
                className={cn(
                    'border-border bg-surface text-surface-foreground focus-within:ring-brand-500 flex min-h-10 items-stretch overflow-hidden rounded-md border focus-within:ring-2',
                    invalid && 'border-red-600',
                    disabled && 'cursor-not-allowed opacity-60',
                    readOnly && 'bg-muted/40',
                    containerClassName,
                )}
            >
                <span
                    aria-hidden="true"
                    className="border-border bg-muted/30 text-muted-foreground pointer-events-none flex shrink-0 items-center justify-center border-r px-3 text-base"
                >
                    ₹
                </span>
                <input
                    {...props}
                    ref={ref}
                    type="number"
                    inputMode="decimal"
                    disabled={disabled}
                    readOnly={readOnly}
                    className={cn(
                        'text-surface-foreground min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none disabled:cursor-not-allowed',
                        className,
                    )}
                />
            </div>
        );
    },
);
