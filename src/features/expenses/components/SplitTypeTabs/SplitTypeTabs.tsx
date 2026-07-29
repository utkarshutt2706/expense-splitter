import type { SplitType } from '@data/entities';

interface SplitTypeTabsProps {
    readonly value: SplitType;
    readonly onChange: (value: SplitType) => void;
}

const options: { value: SplitType; label: string }[] = [
    { value: 'equal', label: 'Equal' },
    { value: 'exact', label: 'Exact' },
    { value: 'percentage', label: 'Percentage' },
    { value: 'shares', label: 'Shares' },
];

export function SplitTypeTabs({ value, onChange }: SplitTypeTabsProps) {
    return (
        <div className="inline-flex rounded-md border border-border p-1">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    aria-pressed={value === option.value}
                    onClick={() => onChange(option.value)}
                    className={`cursor-pointer rounded px-3 py-1 text-sm font-medium transition-colors ${
                        value === option.value
                            ? 'bg-brand-600 text-white'
                            : 'text-muted-foreground hover:bg-muted'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
