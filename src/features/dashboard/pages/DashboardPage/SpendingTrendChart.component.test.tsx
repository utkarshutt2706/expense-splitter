import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SpendingTrendChart } from './SpendingTrendChart';

vi.mock('recharts', () => ({
    Area: () => null,
    CartesianGrid: () => null,
    ComposedChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Legend: () => null,
    Line: () => null,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Tooltip: () => null,
    XAxis: () => null,
    YAxis: () => null,
}));

describe('SpendingTrendChart mobile value picker', () => {
    it('uses a popover to select a period and updates the visible values', async () => {
        const user = userEvent.setup();
        render(
            <SpendingTrendChart
                granularity="day"
                data={[
                    {
                        date: '2026-08-07',
                        amount: 100,
                        actualPaid: 60,
                        currentUserShare: 50,
                    },
                    {
                        date: '2026-08-08',
                        amount: 200,
                        actualPaid: 120,
                        currentUserShare: 100,
                    },
                ]}
            />,
        );

        const trigger = screen.getByRole('button', {
            name: /view chart values 8 aug 2026/i,
        });
        expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');

        await user.click(trigger);
        const listbox = screen.getByRole('listbox', { name: /choose chart date/i });
        expect(listbox).toBeVisible();

        await user.click(screen.getByRole('option', { name: /7 aug 2026/i }));

        expect(trigger).toHaveTextContent('7 Aug 2026');
        expect(screen.getAllByText('₹100.00')).not.toHaveLength(0);
        expect(
            screen.queryByRole('listbox', { name: /choose chart date/i }),
        ).not.toBeInTheDocument();
    });
});
