import { Eye, EyeOff } from 'lucide-react';
import { useState, type InputHTMLAttributes, type Ref } from 'react';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    readonly ref?: Ref<HTMLInputElement>;
}

export function PasswordInput({ ref, className, ...props }: PasswordInputProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative">
            <input
                ref={ref}
                type={isVisible ? 'text' : 'password'}
                {...props}
                className={`border-border bg-surface text-surface-foreground focus-visible:ring-brand-500 w-full rounded-md border py-2 pr-10 pl-3 text-sm outline-none focus-visible:ring-2 ${className ?? ''}`}
            />
            <button
                type="button"
                onClick={() => setIsVisible((visible) => !visible)}
                aria-label={isVisible ? 'Hide password' : 'Show password'}
                className="text-muted-foreground hover:text-surface-foreground absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer"
            >
                {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
        </div>
    );
}
