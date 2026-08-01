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
