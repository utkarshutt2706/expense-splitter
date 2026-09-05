import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MIN_CATEGORY_WIDTH, PLOT_HEIGHT, VALUE_AXIS_WIDTH } from '@features/analytics/utils';
import { ScrollableChart } from './ScrollableChart';

vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@features/analytics/components/PinnedValueAxis', () => ({
    PinnedValueAxis: ({ ticks }: { ticks: number[] }) => (
        <span data-testid="axis">{ticks.join(',')}</span>
    ),
}));

describe('ScrollableChart', () => {
    it('renders its pinned axis, chart, and legend using the default category width', () => {
        render(
            <ScrollableChart
                categories={3}
                label="Spending chart"
                ticks={[0, 50]}
                legend={[{ name: 'Trips', fill: 'blue' }]}
            >
                <span>chart contents</span>
            </ScrollableChart>,
        );
        expect(screen.getByTestId('axis')).toHaveTextContent('0,50');
        expect(screen.getByLabelText('Spending chart')).toHaveStyle({
            minWidth: `${3 * MIN_CATEGORY_WIDTH}px`,
            height: `${PLOT_HEIGHT}px`,
        });
        expect(screen.getByText('chart contents')).toBeInTheDocument();
        expect(screen.getByText('Trips').querySelector('span')).toHaveStyle({
            background: 'blue',
        });
        expect(screen.getByLabelText('Spending chart').parentElement?.parentElement).toHaveStyle({
            paddingLeft: `${VALUE_AXIS_WIDTH}px`,
        });
    });

    it('honors a custom per-category width', () => {
        render(
            <ScrollableChart categories={2} perCategory={80} label="Chart" ticks={[]} legend={[]}>
                <span />
            </ScrollableChart>,
        );
        expect(screen.getByLabelText('Chart')).toHaveStyle({ minWidth: '160px' });
    });
});
