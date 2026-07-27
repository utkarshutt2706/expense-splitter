import { Search } from 'lucide-react';

interface SearchInputProps {
    readonly value: string;
    readonly onChange: (value: string) => void;
    readonly placeholder: string;
    readonly ariaLabel: string;
}

export function SearchInput({ value, onChange, placeholder, ariaLabel }: SearchInputProps) {
    return (
        <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                aria-label={ariaLabel}
                className="w-full rounded-md border border-border bg-surface py-2 pr-3 pl-9 text-sm text-surface-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            />
        </div>
    );
}
