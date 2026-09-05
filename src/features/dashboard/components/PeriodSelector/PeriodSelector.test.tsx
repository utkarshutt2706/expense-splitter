import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PeriodSelector, type TrendEntry } from './PeriodSelector';

vi.mock('@shared/components', () => ({
    ResponsivePopoverContent: ({
        children,
        sideOffset: _sideOffset,
        onOpenAutoFocus: _onOpenAutoFocus,
        ...props
    }: React.HTMLAttributes<HTMLDivElement> & {
        sideOffset?: number;
        onOpenAutoFocus?: (event: Event) => void;
    }) => <div {...props}>{children}</div>,
}));

const entries: TrendEntry[] = [
    { period: '2026-07', label: 'Jul 26', amount: 10, currentUserShare: 5, actualPaid: 5 },
    { period: '2026-08', label: 'Aug 26', amount: 20, currentUserShare: 8, actualPaid: 12 },
];

describe('PeriodSelector', () => {
    it('shows the selected label and closed state', () => {
        render(
            <PeriodSelector
                entries={entries}
                selectedPeriod="2026-07"
                open={false}
                onOpenChange={vi.fn()}
                onSelect={vi.fn()}
            />,
        );
        expect(screen.getByRole('button', { name: 'Jul 26' })).toHaveAttribute(
            'aria-expanded',
            'false',
        );
    });

    it('falls back to the latest entry and selects an option before closing', () => {
        const onSelect = vi.fn();
        const onOpenChange = vi.fn();
        render(
            <PeriodSelector
                entries={entries}
                selectedPeriod="missing"
                open
                onOpenChange={onOpenChange}
                onSelect={onSelect}
            />,
        );
        expect(screen.getByRole('button', { name: 'Aug 26' })).toHaveAttribute(
            'aria-expanded',
            'true',
        );
        expect(screen.getByRole('option', { name: 'Aug 26' })).toHaveAttribute(
            'aria-selected',
            'true',
        );
        fireEvent.click(screen.getByRole('option', { name: 'Jul 26' }));
        expect(onSelect).toHaveBeenCalledWith('2026-07');
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });
});
