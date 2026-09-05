import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SpendingTrendGraph } from './SpendingTrendGraph';

vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ComposedChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
        <div data-testid="chart" data-data={JSON.stringify(data)}>
            {children}
        </div>
    ),
    CartesianGrid: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    Legend: () => null,
    Area: () => null,
    Line: () => null,
}));

describe('SpendingTrendGraph', () => {
    it('renders the unavailable state only for missing daily data', () => {
        render(<SpendingTrendGraph data={undefined} granularity="day" />);
        expect(
            screen.getByRole('heading', { name: 'Daily trend unavailable' }),
        ).toBeInTheDocument();
    });

    it('renders nothing for an empty series', () => {
        const { container } = render(<SpendingTrendGraph data={[]} granularity="month" />);
        expect(container).toBeEmptyDOMElement();
    });

    it.each([
        [
            'day',
            [{ date: '2026-08-10', amount: 5, actualPaid: 3, currentUserShare: 2 }],
            'Daily spending chart',
            '10 Aug 2026',
        ],
        [
            'month',
            [{ month: '2026-08', amount: 5, actualPaid: 3, currentUserShare: 2 }],
            'Monthly spending chart',
            'Aug 26',
        ],
    ] as const)(
        'labels a singleton %s series and adds plotting endpoints',
        (granularity, data, label, formatted) => {
            render(<SpendingTrendGraph data={[...data] as never} granularity={granularity} />);
            expect(screen.getByLabelText(label)).toBeInTheDocument();
            const plotted = JSON.parse(screen.getByTestId('chart').dataset.data!) as Array<{
                label: string;
            }>;
            expect(plotted).toHaveLength(3);
            expect(plotted[1]?.label).toBe(formatted);
        },
    );
});
