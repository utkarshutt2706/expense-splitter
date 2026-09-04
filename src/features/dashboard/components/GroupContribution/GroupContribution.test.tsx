import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { GroupContribution } from './GroupContribution';

vi.mock('@features/dashboard/components/ContributionBar', () => ({
    ContributionBar: (props: object) => (
        <span data-testid="bar" data-props={JSON.stringify(props)} />
    ),
}));
vi.mock('@features/dashboard/components/ContributionValues', () => ({
    ContributionValues: ({ group }: { group: DashboardGroupSpend }) => (
        <span data-testid="values">{group.groupId}</span>
    ),
}));

const group = {
    groupId: 'trip',
    name: 'Trip',
    actualPaid: 75,
    currentUserShare: 50,
} as DashboardGroupSpend;

describe('GroupContribution', () => {
    it('renders comparable bars against the larger contribution', () => {
        render(<GroupContribution group={group} compareWithBars />);
        expect(screen.getByRole('figure')).toHaveAccessibleName(
            'Trip: paid by you ₹75.00; your share ₹50.00',
        );
        expect(screen.getAllByTestId('bar').map((node) => JSON.parse(node.dataset.props!))).toEqual(
            [
                { label: 'Paid by you', value: 75, scale: 75, solid: true },
                { label: 'Your share', value: 50, scale: 75 },
            ],
        );
    });

    it('uses compact contribution values when comparison bars are unnecessary', () => {
        render(<GroupContribution group={group} compareWithBars={false} />);
        expect(screen.getByTestId('values')).toHaveTextContent('trip');
        expect(screen.queryByTestId('bar')).not.toBeInTheDocument();
    });
});
