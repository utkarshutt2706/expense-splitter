import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type {
    DashboardGroupSpend,
    DashboardMemberShare,
} from '@features/dashboard/api/dashboardApi';
import { Participants } from './Participants';

vi.mock('@shared/components', () => ({
    Avatar: ({ name }: { name: string }) => <span data-testid="avatar">{name}</span>,
}));
vi.mock('@features/dashboard/components/ProgressBar', () => ({
    ProgressBar: ({ percentage }: { percentage: number }) => (
        <span data-testid="progress" data-percentage={percentage} />
    ),
}));

const member = (
    userId: string,
    name: string,
    amount: number,
    isCurrentUser = false,
): DashboardMemberShare => ({ userId, name, amount, isCurrentUser });
const group = (memberShares: DashboardMemberShare[], amount = 100) =>
    ({ groupId: 'group', name: 'Group', amount, memberShares }) as DashboardGroupSpend;

describe('Participants', () => {
    it('renders nothing when the group has no spending', () => {
        const { container } = render(<Participants group={group([], 0)} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('orders the current user first, then names, and calculates shares and relative bars', () => {
        render(
            <Participants
                group={group([
                    member('zoe', 'Zoe', 20),
                    member('alex', 'Alex', 50),
                    member('current', 'Current User', 30, true),
                ])}
            />,
        );
        const rows = screen.getAllByRole('listitem');
        expect(rows.map((row) => row.textContent)).toEqual([
            expect.stringContaining('Current'),
            expect.stringContaining('Alex'),
            expect.stringContaining('Zoe'),
        ]);
        expect(screen.getByText('₹30.00')).toBeInTheDocument();
        expect(screen.getByText('30.0%')).toBeInTheDocument();
        expect(screen.getAllByTestId('progress').map((node) => node.dataset.percentage)).toEqual([
            '60',
            '100',
            '40',
        ]);
    });

    it('shows eight participants initially and reveals the complete list', () => {
        const shares = Array.from({ length: 10 }, (_, index) =>
            member(`${index}`, `Member ${index}`, 10),
        );
        render(<Participants group={group(shares)} />);
        expect(screen.getAllByRole('listitem')).toHaveLength(8);
        fireEvent.click(screen.getByRole('button', { name: 'Show all 10 participants' }));
        expect(screen.getAllByRole('listitem')).toHaveLength(10);
    });
});
