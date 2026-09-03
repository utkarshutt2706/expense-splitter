import * as Popover from '@radix-ui/react-popover';
import { ArrowLeft, Check, ChevronDown } from 'lucide-react';
import type { MouseEvent } from 'react';

import { ResponsivePopoverContent } from '@shared/components';
import { periodLabel, type DashboardPeriod } from '@features/dashboard/utils/dashboardDateRange';
import { useDashboardTimeFilter } from '@features/dashboard/hooks/useDashboardTimeFilter';

const PRESETS = [
    'all-time',
    'this-month',
    'previous-month',
    'last-three-months',
    'this-year',
] as const;

function openDatePicker(event: MouseEvent<HTMLInputElement>) {
    try {
        event.currentTarget.showPicker?.();
    } catch {
        // Fall back to the browser's normal date-input behavior when restricted.
    }
}

export function DashboardTimeFilter({
    period,
    onChange,
}: Readonly<{
    period: DashboardPeriod;
    onChange: (period: DashboardPeriod) => void;
}>) {
    const filter = useDashboardTimeFilter(period, onChange);
    const {
        applyCustom,
        changeStart,
        choosePreset,
        end,
        error,
        maximumEnd,
        open,
        showCustom,
        start,
        today,
    } = filter;

    return (
        <div className="w-full text-sm font-medium">
            <span id="dashboard-period-label">Time period</span>
            <Popover.Root open={open} onOpenChange={filter.changeOpen}>
                <Popover.Trigger asChild>
                    <button
                        type="button"
                        aria-labelledby="dashboard-period-label dashboard-period-value"
                        aria-haspopup="dialog"
                        aria-expanded={open}
                        className="border-border bg-surface focus-visible:ring-brand-500 mt-1 flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 text-left outline-none focus-visible:ring-2"
                    >
                        <span id="dashboard-period-value" className="truncate">
                            {period.preset === 'custom' ? period.label : periodLabel(period.preset)}
                        </span>
                        <ChevronDown className="text-muted-foreground size-4 shrink-0" />
                    </button>
                </Popover.Trigger>
                <Popover.Portal>
                    <ResponsivePopoverContent
                        align="start"
                        sideOffset={8}
                        aria-label="Choose dashboard time period"
                        className="border-border bg-surface z-50 w-[var(--radix-popover-trigger-width)] min-w-72 rounded-lg border p-2 shadow-lg"
                    >
                        {showCustom ? (
                            <div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        filter.setShowCustom(false);
                                        filter.setError(null);
                                    }}
                                    className="text-muted-foreground hover:bg-muted focus-visible:bg-muted flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-sm outline-none"
                                >
                                    <ArrowLeft className="size-4" /> Back to presets
                                </button>
                                <div className="border-border mt-1 border-t px-2 pt-3">
                                    <p className="font-medium">Custom date range</p>
                                    <p className="text-muted-foreground mt-0.5 text-xs">
                                        Select up to one year.
                                    </p>
                                    <div className="mt-3 grid gap-3">
                                        <label className="cursor-pointer text-xs font-medium">
                                            <span className="block">From</span>
                                            <input
                                                aria-label="Custom range start"
                                                type="date"
                                                value={start}
                                                max={today}
                                                onClick={openDatePicker}
                                                onChange={(event) =>
                                                    changeStart(event.target.value)
                                                }
                                                className="border-border bg-surface focus:border-brand-500 focus:ring-brand-500 mt-1 min-h-11 w-full rounded-md border px-2 outline-none focus:ring-1"
                                            />
                                        </label>
                                        <label className="cursor-pointer text-xs font-medium">
                                            <span className="block">To</span>
                                            <input
                                                aria-label="Custom range end"
                                                type="date"
                                                value={end}
                                                min={start || undefined}
                                                max={maximumEnd}
                                                disabled={!start}
                                                onClick={openDatePicker}
                                                onChange={(event) =>
                                                    filter.setEnd(event.target.value)
                                                }
                                                className="border-border bg-surface focus:border-brand-500 focus:ring-brand-500 mt-1 min-h-11 w-full rounded-md border px-2 outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60"
                                            />
                                        </label>
                                    </div>
                                    {error && (
                                        <p role="alert" className="text-owe mt-2 text-xs">
                                            {error}
                                        </p>
                                    )}
                                    <button
                                        type="button"
                                        onClick={applyCustom}
                                        className="bg-brand-600 hover:bg-brand-700 focus-visible:ring-brand-500 mt-3 min-h-11 w-full cursor-pointer rounded-md px-4 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:outline-none"
                                    >
                                        Apply dates
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div aria-label="Time period options">
                                {PRESETS.map((value) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => choosePreset(value)}
                                        className="hover:bg-muted focus-visible:bg-muted flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2 text-left text-sm outline-none"
                                    >
                                        <span>{periodLabel(value)}</span>
                                        {period.preset === value && (
                                            <Check className="text-brand-600 size-4 shrink-0" />
                                        )}
                                    </button>
                                ))}
                                <div className="border-border mt-1 border-t pt-1">
                                    <button
                                        type="button"
                                        onClick={() => filter.setShowCustom(true)}
                                        className="hover:bg-muted focus-visible:bg-muted flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2 text-left text-sm outline-none"
                                    >
                                        <span>Custom date range</span>
                                        {period.preset === 'custom' && (
                                            <Check className="text-brand-600 size-4 shrink-0" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </ResponsivePopoverContent>
                </Popover.Portal>
            </Popover.Root>
        </div>
    );
}
