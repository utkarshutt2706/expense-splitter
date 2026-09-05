import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PLOT_HEIGHT, VALUE_AXIS_WIDTH } from '@features/analytics/utils';
import { PinnedValueAxis } from './PinnedValueAxis';

describe('PinnedValueAxis', () => {
    it('pins formatted ticks to the chart plotting area', () => {
        const { container } = render(<PinnedValueAxis ticks={[0, 500, 1000]} />);
        const axis = container.firstElementChild;
        expect(axis).toHaveAttribute('aria-hidden', 'true');
        expect(axis).toHaveStyle({ width: `${VALUE_AXIS_WIDTH}px`, height: `${PLOT_HEIGHT}px` });
        expect(screen.getByText(/1k/i)).toHaveStyle({ top: '8px' });
        expect(screen.getByText(/₹0/)).toHaveStyle({ top: '250px' });
    });

    it('positions zero safely when it is the only tick', () => {
        render(<PinnedValueAxis ticks={[0]} />);
        expect(screen.getByText(/₹0/)).toHaveStyle({ top: '250px' });
    });
});
