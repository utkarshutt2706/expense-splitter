import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import type { User } from '@data/entities';
import { GroupMembersStack } from './GroupMembersStack';

const members: User[] = [
    { id: 'user-1', name: 'Alex Morgan', email: 'alex@example.com' },
    { id: 'user-2', name: 'Priya Sharma', email: 'priya@example.com' },
    { id: 'user-3', name: 'Jordan Lee', phone: '5551234567' },
];

describe('GroupMembersStack', () => {
    describe('desktop row', () => {
        it('does not show an overflow bubble when everyone fits', () => {
            render(<GroupMembersStack members={members} maxVisible={5} />);

            const desktopRow = within(screen.getByTestId('members-desktop'));
            expect(desktopRow.queryByText(/^\+/)).not.toBeInTheDocument();
        });

        it('shows an overflow bubble with the remaining count', () => {
            render(<GroupMembersStack members={members} maxVisible={2} />);

            const desktopRow = within(screen.getByTestId('members-desktop'));
            expect(desktopRow.getByText('+1')).toBeInTheDocument();
        });
    });

    describe('mobile row', () => {
        it('caps visible avatars at maxVisibleMobile, overflowing the rest', () => {
            render(<GroupMembersStack members={members} maxVisibleMobile={2} />);

            const mobileRow = within(screen.getByTestId('members-mobile'));
            expect(mobileRow.getByText('+1')).toBeInTheDocument();
        });

        it('does not show an overflow bubble when everyone fits within the mobile cap', () => {
            render(<GroupMembersStack members={members} maxVisibleMobile={3} />);

            const mobileRow = within(screen.getByTestId('members-mobile'));
            expect(mobileRow.queryByText(/^\+/)).not.toBeInTheDocument();
        });
    });

    it('opens a popover with the full member list when clicked', async () => {
        const user = userEvent.setup();
        render(<GroupMembersStack members={members} maxVisible={2} />);

        expect(screen.queryByText('Jordan Lee')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /show all 3 members/i }));

        expect(screen.getByText('Alex Morgan')).toBeInTheDocument();
        expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
        expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
        expect(screen.getByText('5551234567')).toBeInTheDocument();
    });

    it('shows an add/remove members option as the last item in the popover', async () => {
        const user = userEvent.setup();
        render(<GroupMembersStack members={members} />);

        await user.click(screen.getByRole('button', { name: /show all 3 members/i }));

        expect(screen.getByRole('button', { name: /add\/remove members/i })).toBeInTheDocument();
    });
});
