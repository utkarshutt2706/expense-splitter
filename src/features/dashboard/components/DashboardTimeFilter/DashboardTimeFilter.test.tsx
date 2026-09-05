import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useDashboardTimeFilter } from '@features/dashboard/hooks/useDashboardTimeFilter';
import type { DashboardPeriod } from '@features/dashboard/utils/dashboardDateRange';
import { DashboardTimeFilter } from './DashboardTimeFilter';

vi.mock('@features/dashboard/hooks/useDashboardTimeFilter', () => ({
    useDashboardTimeFilter: vi.fn(),
}));
vi.mock('@shared/components', () => ({
    ResponsivePopoverContent: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
        <div {...props}>{children}</div>
    ),
}));

const choosePreset = vi.fn();
const changeOpen = vi.fn();
const changeStart = vi.fn();
const setEnd = vi.fn();
const applyCustom = vi.fn();
const setShowCustom = vi.fn();
const setError = vi.fn();
const period: DashboardPeriod = { preset: 'this-month', label: 'This month' };

function mockFilter(overrides: Record<string, unknown> = {}) {
    vi.mocked(useDashboardTimeFilter).mockReturnValue({
        applyCustom,
        changeOpen,
        changeStart,
        choosePreset,
        end: '2026-08-17',
        error: null,
        maximumEnd: '2026-08-17',
        open: true,
        setEnd,
        setError,
        setShowCustom,
        showCustom: false,
        start: '2026-08-01',
        today: '2026-08-17',
        ...overrides,
    } as ReturnType<typeof useDashboardTimeFilter>);
}

describe('DashboardTimeFilter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFilter();
    });

    it('renders the controlled current period and preset choices', () => {
        render(<DashboardTimeFilter period={period} onChange={vi.fn()} />);
        expect(screen.getByRole('button', { name: 'Time period This month' })).toHaveAttribute(
            'aria-expanded',
            'true',
        );
        fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
        expect(choosePreset).toHaveBeenCalledWith('previous-month');
        fireEvent.click(screen.getByRole('button', { name: 'Custom date range' }));
        expect(setShowCustom).toHaveBeenCalledWith(true);
    });

    it('renders custom inputs, constraints, errors, and actions', () => {
        mockFilter({ showCustom: true, error: 'Invalid range' });
        render(<DashboardTimeFilter period={period} onChange={vi.fn()} />);
        const start = screen.getByLabelText('Custom range start');
        const end = screen.getByLabelText('Custom range end');
        expect(start).toHaveValue('2026-08-01');
        expect(start).toHaveAttribute('max', '2026-08-17');
        expect(end).toHaveAttribute('min', '2026-08-01');
        expect(end).toHaveAttribute('max', '2026-08-17');
        expect(screen.getByRole('alert')).toHaveTextContent('Invalid range');
        fireEvent.change(start, { target: { value: '2026-08-02' } });
        fireEvent.change(end, { target: { value: '2026-08-10' } });
        fireEvent.click(screen.getByRole('button', { name: 'Apply dates' }));
        expect(changeStart).toHaveBeenCalledWith('2026-08-02');
        expect(setEnd).toHaveBeenCalledWith('2026-08-10');
        expect(applyCustom).toHaveBeenCalledOnce();
    });

    it('returns from custom controls and clears their error', () => {
        mockFilter({ showCustom: true });
        render(<DashboardTimeFilter period={period} onChange={vi.fn()} />);
        fireEvent.click(screen.getByRole('button', { name: 'Back to presets' }));
        expect(setShowCustom).toHaveBeenCalledWith(false);
        expect(setError).toHaveBeenCalledWith(null);
    });
});
