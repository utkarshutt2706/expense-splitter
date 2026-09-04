import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { PositionBalance } from './PositionBalance';

describe('PositionBalance', () => {
    it('shows both directions for a mixed position', () => {
        render(<PositionBalance receive={50} pay={20} />);
        expect(screen.getByText('To receive ₹50.00')).toHaveClass('text-owed');
        expect(screen.getByText('To pay ₹20.00')).toHaveClass('text-owe');
    });

    it.each([
        [30, 0, 'You are owed ₹30.00 overall', 'text-owed'],
        [0, 25, 'You owe ₹25.00 overall', 'text-owe'],
        [0, 0, 'You are settled up', ''],
    ] as const)('renders receive=%s and pay=%s', (receive, pay, text, className) => {
        render(<PositionBalance receive={receive} pay={pay} />);
        const element = screen.getByText(text);
        if (className) expect(element).toHaveClass(className);
        else expect(element).toBeInTheDocument();
    });

    it('omits overall wording for a selected group', () => {
        render(<PositionBalance receive={10} pay={0} selected={{} as DashboardGroupSpend} />);
        expect(screen.getByText('You are owed ₹10.00')).toBeInTheDocument();
    });
});
