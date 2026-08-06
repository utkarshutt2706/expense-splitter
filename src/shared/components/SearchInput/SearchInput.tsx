import { Search } from 'lucide-react';

import { cn } from '@shared/utils';

interface SearchInputProps {
    readonly value: string;
    readonly onChange: (value: string) => void;
    readonly placeholder: string;
    readonly ariaLabel: string;
    // Fills the available width by default. Page-level search bars that sit
    // next to a button in a flex row pass their own cap, e.g. "max-w-xs".
    readonly className?: string;
}

export function SearchInput({
    value,
    onChange,
    placeholder,
    ariaLabel,
    className = '',
}: SearchInputProps) {
    return (
        <div className={cn('relative w-full', className)}>
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                aria-label={ariaLabel}
                className="border-border bg-surface text-surface-foreground focus-visible:ring-brand-500 w-full rounded-md border py-2 pr-3 pl-9 text-sm outline-none focus-visible:ring-2"
            />
        </div>
    );
}
