import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ANALYTICS_CHART_TICK, X_AXIS_HEIGHT } from '@features/analytics/utils';
import { ChartAxes } from './ChartAxes';

const mocks = vi.hoisted(() => ({ grid: vi.fn(), x: vi.fn(), y: vi.fn() }));
vi.mock('recharts', () => ({
    CartesianGrid: (props: unknown) => (mocks.grid(props), null),
    XAxis: (props: unknown) => (mocks.x(props), null),
    YAxis: (props: unknown) => (mocks.y(props), null),
}));

describe('ChartAxes', () => {
    it('configures the shared grid and axes from the supplied ticks', () => {
        render(<ChartAxes ticks={[0, 50, 100]} />);

        expect(mocks.grid).toHaveBeenCalledWith(
            expect.objectContaining({
                stroke: 'var(--border-color)',
                strokeDasharray: '3 3',
                vertical: false,
            }),
        );
        expect(mocks.x).toHaveBeenCalledWith(
            expect.objectContaining({
                dataKey: 'name',
                height: X_AXIS_HEIGHT,
                tick: ANALYTICS_CHART_TICK,
                tickLine: false,
            }),
        );
        expect(mocks.y).toHaveBeenCalledWith(
            expect.objectContaining({ hide: true, domain: [0, 100], ticks: [0, 50, 100] }),
        );
    });

    it('uses zero as the upper domain for an empty tick collection', () => {
        render(<ChartAxes ticks={[]} />);
        expect(mocks.y).toHaveBeenLastCalledWith(expect.objectContaining({ domain: [0, 0] }));
    });
});
