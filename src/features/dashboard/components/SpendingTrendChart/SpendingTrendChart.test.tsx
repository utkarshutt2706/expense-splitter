import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { SpendingTrendChart } from './SpendingTrendChart';

describe('SpendingTrendChart period picker', () => {
    it('distinguishes unavailable daily data from an available but empty series', () => {
        const unavailable = render(<SpendingTrendChart granularity="day" data={undefined} />);
        expect(
            screen.getByRole('heading', { name: 'Daily trend unavailable' }),
        ).toBeInTheDocument();
        unavailable.unmount();

        const empty = render(<SpendingTrendChart granularity="month" data={[]} />);
        expect(empty.container).toBeEmptyDOMElement();
    });

    it('defaults to the latest monthly period and uses monthly explanatory copy', () => {
        render(
            <SpendingTrendChart
                granularity="month"
                data={[
                    { month: '2026-07', amount: 50, actualPaid: 30, currentUserShare: 20 },
                    { month: '2026-08', amount: 80, actualPaid: 40, currentUserShare: 40 },
                ]}
            />,
        );

        expect(screen.getByRole('button', { name: 'Aug 26' })).toBeInTheDocument();
        expect(screen.getByText(/monthly recorded expenses/i)).toBeInTheDocument();
        expect(screen.getAllByText('₹80.00')).not.toHaveLength(0);
    });

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
            name: '8 Aug 2026',
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
