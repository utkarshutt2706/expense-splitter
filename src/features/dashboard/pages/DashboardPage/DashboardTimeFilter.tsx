import * as Popover from '@radix-ui/react-popover';
import { ArrowLeft, Check, ChevronDown } from 'lucide-react';
import { useState, type MouseEvent } from 'react';

import { ResponsivePopoverContent } from '@shared/components';

import {
    customPeriod,
    dateInputValue,
    periodLabel,
    presetPeriod,
    type DashboardPeriod,
    type DashboardPeriodPreset,
} from './dashboardDateRange';

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
    const now = new Date();
    const [open, setOpen] = useState(false);
    const [showCustom, setShowCustom] = useState(false);
    const [start, setStart] = useState(
        dateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)),
    );
    const [end, setEnd] = useState(dateInputValue(now));
    const [error, setError] = useState<string | null>(null);
    const today = dateInputValue(now);
    const maximumEnd = (() => {
        if (!start) return undefined;
        const anniversary = new Date(`${start}T00:00:00`);
        anniversary.setFullYear(anniversary.getFullYear() + 1);
        anniversary.setDate(anniversary.getDate() - 1);
        return dateInputValue(anniversary) < today ? dateInputValue(anniversary) : today;
    })();

    function changeStart(value: string) {
        setStart(value);
        setError(null);
        if (!value) {
            setEnd('');
            return;
        }
        const anniversary = new Date(`${value}T00:00:00`);
        anniversary.setFullYear(anniversary.getFullYear() + 1);
        anniversary.setDate(anniversary.getDate() - 1);
        const nextMaximum =
            dateInputValue(anniversary) < today ? dateInputValue(anniversary) : today;
        if (end < value || end > nextMaximum) setEnd('');
    }

    function choosePreset(value: Exclude<DashboardPeriodPreset, 'custom'>) {
        onChange(presetPeriod(value));
        setError(null);
        setOpen(false);
    }

    function applyCustom() {
        try {
            onChange(customPeriod(start, end));
            setError(null);
            setOpen(false);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Choose a valid date range.');
        }
    }

    return (
        <div className="w-full text-sm font-medium">
            <span id="dashboard-period-label">Time period</span>
            <Popover.Root
                open={open}
                onOpenChange={(nextOpen) => {
                    setOpen(nextOpen);
                    setError(null);
                    if (nextOpen) setShowCustom(period.preset === 'custom');
                }}
            >
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
                                        setShowCustom(false);
                                        setError(null);
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
                                                onChange={(event) => setEnd(event.target.value)}
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
                                        onClick={() => setShowCustom(true)}
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
