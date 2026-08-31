import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronDown } from 'lucide-react';

import { ResponsivePopoverContent } from '@shared/components';

export type TrendEntry = {
    period: string;
    label: string;
    amount: number;
    currentUserShare: number;
    actualPaid: number;
};

export type PeriodSelectorProps = Readonly<{
    entries: TrendEntry[];
    selectedPeriod: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (period: string) => void;
}>;

export function PeriodSelector({
    entries,
    selectedPeriod,
    open,
    onOpenChange,
    onSelect,
}: PeriodSelectorProps) {
    const selected = entries.find((entry) => entry.period === selectedPeriod) ?? entries.at(-1)!;

    return (
        <Popover.Root open={open} onOpenChange={onOpenChange}>
            <Popover.Trigger asChild>
                <button
                    type="button"
                    aria-labelledby="dashboard-chart-period-label dashboard-chart-period-value"
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    className="border-border bg-surface focus-visible:ring-brand-500 flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-md border px-3 text-left outline-none focus-visible:ring-2 md:w-fit"
                >
                    <span id="dashboard-chart-period-value" className="truncate">
                        {selected.label}
                    </span>
                    <ChevronDown
                        aria-hidden="true"
                        className={`text-muted-foreground size-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <ResponsivePopoverContent
                    align="start"
                    sideOffset={8}
                    role="listbox"
                    aria-label="Choose chart date"
                    className="border-border bg-surface z-50 w-[var(--radix-popover-trigger-width)] rounded-lg border p-2 shadow-lg"
                >
                    <div className="max-h-64 overflow-y-auto">
                        {entries.map((entry) => {
                            const isSelected = entry.period === selected.period;
                            return (
                                <button
                                    key={entry.period}
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => {
                                        onSelect(entry.period);
                                        onOpenChange(false);
                                    }}
                                    className="hover:bg-muted focus-visible:bg-muted flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2 text-left outline-none"
                                >
                                    <span className="truncate">{entry.label}</span>
                                    {isSelected && (
                                        <Check
                                            aria-hidden="true"
                                            className="text-brand-600 size-4 shrink-0"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </ResponsivePopoverContent>
            </Popover.Portal>
        </Popover.Root>
    );
}
