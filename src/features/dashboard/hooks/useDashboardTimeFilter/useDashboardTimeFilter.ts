import { useState } from 'react';

import {
    customPeriod,
    dateInputValue,
    presetPeriod,
    type DashboardPeriod,
    type DashboardPeriodPreset,
} from '@features/dashboard/utils/dashboardDateRange';

export function useDashboardTimeFilter(
    period: DashboardPeriod,
    onChange: (period: DashboardPeriod) => void,
) {
    const now = new Date();
    const [open, setOpen] = useState(false);
    const [showCustom, setShowCustom] = useState(false);
    const [start, setStart] = useState(
        dateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)),
    );
    const [end, setEnd] = useState(dateInputValue(now));
    const [error, setError] = useState<string | null>(null);
    const today = dateInputValue(now);

    function maximumEndFor(value: string) {
        if (!value) return undefined;
        const anniversary = new Date(`${value}T00:00:00`);
        anniversary.setFullYear(anniversary.getFullYear() + 1);
        anniversary.setDate(anniversary.getDate() - 1);
        const maximum = dateInputValue(anniversary);
        return maximum < today ? maximum : today;
    }

    function changeStart(value: string) {
        setStart(value);
        setError(null);
        const nextMaximum = maximumEndFor(value);
        if (!value || !nextMaximum || end < value || end > nextMaximum) setEnd('');
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

    function changeOpen(nextOpen: boolean) {
        setOpen(nextOpen);
        setError(null);
        if (nextOpen) setShowCustom(period.preset === 'custom');
    }

    return {
        applyCustom,
        changeOpen,
        changeStart,
        choosePreset,
        end,
        error,
        maximumEnd: maximumEndFor(start),
        open,
        setEnd,
        setError,
        setShowCustom,
        showCustom,
        start,
        today,
    };
}
