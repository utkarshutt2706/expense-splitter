import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { GroupMembersStack } from './GroupMembersStack';

vi.mock('@app/hooks', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/hooks')>()),
    useCurrentUser: () => ({
        data: { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
    }),
}));

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

        expect(screen.getByText('Alex')).toBeInTheDocument();
        expect(screen.getByText('Priya')).toBeInTheDocument();
        expect(screen.getByText('Jordan')).toBeInTheDocument();
        expect(screen.getByText('5551234567')).toBeInTheDocument();
    });

    describe('current user', () => {
        const membersWithCurrentUserLast: User[] = [
            { id: 'user-2', name: 'Priya Sharma', email: 'priya@example.com' },
            { id: 'user-3', name: 'Jordan Lee', phone: '5551234567' },
            { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
        ];

        it('labels the current user as "You" in the popover, regardless of input order', async () => {
            const user = userEvent.setup();
            render(<GroupMembersStack members={membersWithCurrentUserLast} />);

            await user.click(screen.getByRole('button', { name: /show all 3 members/i }));

            expect(screen.getByText('Alex (You)')).toBeInTheDocument();
            expect(screen.queryByText('Alex Morgan')).not.toBeInTheDocument();
        });

        it('always shows the current user first in the popover list', async () => {
            const user = userEvent.setup();
            render(<GroupMembersStack members={membersWithCurrentUserLast} />);

            await user.click(screen.getByRole('button', { name: /show all 3 members/i }));

            const names = screen.getAllByRole('listitem').map((item) => item.textContent);
            expect(names[0]).toContain('You');
        });

        it('always shows the current user first in the avatar rows', () => {
            render(<GroupMembersStack members={membersWithCurrentUserLast} maxVisible={1} />);

            const desktopRow = within(screen.getByTestId('members-desktop'));
            expect(desktopRow.getByText('AM')).toBeInTheDocument();
            expect(desktopRow.queryByText('PS')).not.toBeInTheDocument();
        });
    });
});
