import { Check } from 'lucide-react';

export type GroupScopeOptionProps = Readonly<{
    name: string;
    selected: boolean;
    title?: string;
    onSelect: () => void;
}>;

export function GroupScopeOption({ name, selected, title, onSelect }: GroupScopeOptionProps) {
    return (
        <button
            type="button"
            onClick={onSelect}
            title={title}
            className="hover:bg-muted focus-visible:bg-muted flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2 text-left outline-none"
        >
            <span className="truncate">{name}</span>
            {selected && <Check className="text-brand-600 size-4 shrink-0" />}
        </button>
    );
}
