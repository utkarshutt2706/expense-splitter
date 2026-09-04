import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DashboardPeriod } from '@features/dashboard/utils/dashboardDateRange';

import { useDashboardTimeFilter } from './useDashboardTimeFilter';

const overall: DashboardPeriod = { preset: 'all-time', label: 'Overall' };

describe('useDashboardTimeFilter', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 7, 17, 12));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('initializes a closed custom range for the current month', () => {
        const { result } = renderHook(() => useDashboardTimeFilter(overall, vi.fn()));

        expect(result.current).toMatchObject({
            open: false,
            showCustom: false,
            start: '2026-08-01',
            end: '2026-08-17',
            today: '2026-08-17',
            maximumEnd: '2026-08-17',
            error: null,
        });
    });

    it('chooses a preset, clears errors, and closes the selector', () => {
        const onChange = vi.fn();
        const { result } = renderHook(() => useDashboardTimeFilter(overall, onChange));
        act(() => {
            result.current.changeOpen(true);
            result.current.setError('Old error');
        });

        act(() => result.current.choosePreset('previous-month'));

        expect(onChange).toHaveBeenCalledWith({
            preset: 'previous-month',
            label: 'Previous month',
            range: {
                from: new Date(2026, 6, 1).toISOString(),
                to: new Date(2026, 7, 1).toISOString(),
            },
        });
        expect(result.current.open).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('shows custom controls when reopening an existing custom period', () => {
        const custom: DashboardPeriod = { preset: 'custom', label: 'Custom date range' };
        const { result } = renderHook(() => useDashboardTimeFilter(custom, vi.fn()));
        act(() => result.current.setError('Old error'));

        act(() => result.current.changeOpen(true));

        expect(result.current.open).toBe(true);
        expect(result.current.showCustom).toBe(true);
        expect(result.current.error).toBeNull();
    });

    it('applies a valid inclusive custom range and closes the selector', () => {
        const onChange = vi.fn();
        const { result } = renderHook(() => useDashboardTimeFilter(overall, onChange));
        act(() => {
            result.current.changeOpen(true);
            result.current.changeStart('2026-08-05');
            result.current.setEnd('2026-08-10');
        });

        act(() => result.current.applyCustom());

        expect(onChange).toHaveBeenCalledWith({
            preset: 'custom',
            label: `${new Date('2026-08-05T00:00:00').toLocaleDateString()} – ${new Date('2026-08-10T00:00:00').toLocaleDateString()}`,
            range: {
                from: new Date('2026-08-05T00:00:00').toISOString(),
                to: new Date('2026-08-11T00:00:00').toISOString(),
            },
        });
        expect(result.current.open).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('exposes validation errors and leaves the selector open for invalid custom ranges', () => {
        const onChange = vi.fn();
        const { result } = renderHook(() => useDashboardTimeFilter(overall, onChange));
        act(() => {
            result.current.changeOpen(true);
            result.current.changeStart('2026-08-10');
            result.current.setEnd('2026-08-05');
        });

        act(() => result.current.applyCustom());

        expect(onChange).not.toHaveBeenCalled();
        expect(result.current.open).toBe(true);
        expect(result.current.error).toBe('Start date must be on or before end date.');
    });

    it('limits end dates to one inclusive year or today, whichever is earlier', () => {
        const { result } = renderHook(() => useDashboardTimeFilter(overall, vi.fn()));

        act(() => result.current.changeStart('2024-02-29'));
        expect(result.current.maximumEnd).toBe('2025-02-28');
        expect(result.current.end).toBe('');

        act(() => result.current.changeStart('2026-08-01'));
        expect(result.current.maximumEnd).toBe('2026-08-17');
    });

    it('clears the end date and error when a new start makes the current end invalid', () => {
        const { result } = renderHook(() => useDashboardTimeFilter(overall, vi.fn()));
        act(() => {
            result.current.setError('Old error');
            result.current.setEnd('2026-08-10');
        });
        act(() => result.current.changeStart('2026-08-11'));

        expect(result.current.start).toBe('2026-08-11');
        expect(result.current.end).toBe('');
        expect(result.current.error).toBeNull();

        act(() => result.current.changeStart(''));
        expect(result.current.maximumEnd).toBeUndefined();
    });
});
