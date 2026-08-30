import { ChartNoAxesColumn, Equal, Percent } from 'lucide-react';
import type { ReactNode } from 'react';

import type { SplitType } from '@data/entities';

type SplitTypeTabsProps = Readonly<{
    value: SplitType;
    onChange: (value: SplitType) => void;
}>;

const options: { value: SplitType; label: string; glyph: ReactNode }[] = [
    { value: 'equal', label: 'Equal', glyph: <Equal className="size-4" /> },
    { value: 'exact', label: 'Exact', glyph: <span className="text-xs font-semibold">1.23</span> },
    { value: 'percentage', label: 'Percentage', glyph: <Percent className="size-4" /> },
    { value: 'shares', label: 'Shares', glyph: <ChartNoAxesColumn className="size-4" /> },
];

export function SplitTypeTabs({ value, onChange }: SplitTypeTabsProps) {
    return (
        <div className="border-border flex justify-between gap-1 rounded-md border p-1">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    aria-pressed={value === option.value}
                    aria-label={option.label}
                    title={option.label}
                    onClick={() => onChange(option.value)}
                    className={`flex h-9 flex-1 cursor-pointer items-center justify-center rounded px-3 transition-colors ${
                        value === option.value
                            ? 'bg-brand-600 text-white'
                            : 'text-muted-foreground hover:bg-muted'
                    }`}
                >
                    {option.glyph}
                </button>
            ))}
        </div>
    );
}
