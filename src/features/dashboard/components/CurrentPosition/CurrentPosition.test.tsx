import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { CurrentPosition } from './CurrentPosition';

vi.mock('@features/dashboard/components/PositionBalance', () => ({
    PositionBalance: ({
        receive,
        pay,
        selected,
    }: {
        receive: number;
        pay: number;
        selected?: DashboardGroupSpend;
    }) => (
        <span data-testid="position">
            {receive}:{pay}:{selected?.groupId ?? 'all'}
        </span>
    ),
}));
const group = (groupId: string, currentBalance: number) =>
    ({ groupId, currentBalance }) as DashboardGroupSpend;

describe('CurrentPosition', () => {
    it('aggregates positive and negative positions across all groups', () => {
        render(
            <MemoryRouter>
                <CurrentPosition
                    groups={[group('a', 30), group('b', -20), group('c', 5)]}
                    periodLabel="Overall"
                />
            </MemoryRouter>,
        );
        expect(screen.getByText('Position for overall')).toBeInTheDocument();
        expect(screen.getByTestId('position')).toHaveTextContent('35:20:all');
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('uses only the selected group and links to its balances', () => {
        const selected = group('trip', -40);
        render(
            <MemoryRouter>
                <CurrentPosition
                    groups={[group('a', 30), selected]}
                    selected={selected}
                    periodLabel="This month"
                />
            </MemoryRouter>,
        );
        expect(screen.getByTestId('position')).toHaveTextContent('0:40:trip');
        expect(screen.getByRole('link', { name: 'View balances' })).toHaveAttribute(
            'href',
            '/groups/trip/balance',
        );
    });
});
