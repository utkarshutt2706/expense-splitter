import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import type { SettlementTransaction } from '../../utils/simplifyDebts';
import { GroupBalanceAccordionList } from './GroupBalanceAccordionList';

vi.mock('@app/hooks', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/hooks')>()),
    useCurrentUser: () => ({
        data: { id: CURRENT_USER_ID, name: 'Utkarsh Srivastava', email: 'utkarsh@example.com' },
    }),
}));

const members: User[] = [
    { id: 'friend-1', name: 'Abhinav', email: 'abhinav@example.com' },
    { id: 'friend-2', name: 'Khem', email: 'khem@example.com' },
];

const netBalances = new Map([
    ['friend-1', -38],
    ['friend-2', 0],
]);

const transactions: SettlementTransaction[] = [
    { fromUserId: 'friend-1', toUserId: 'friend-2', amount: 38 },
];

describe('GroupBalanceAccordionList', () => {
    it('renders one accordion per member', () => {
        render(
            <GroupBalanceAccordionList
                members={members}
                netBalances={netBalances}
                transactions={transactions}
            />,
        );

        expect(screen.getByText(/abhinav owes ₹38\.00 in total/i)).toBeInTheDocument();
        expect(screen.getByText(/khem is settled up/i)).toBeInTheDocument();
    });

    it('expands accordions for non-zero balances and collapses settled ones by default', () => {
        render(
            <GroupBalanceAccordionList
                members={members}
                netBalances={netBalances}
                transactions={transactions}
            />,
        );

        expect(screen.getByRole('button', { name: /abhinav owes/i })).toHaveAttribute(
            'aria-expanded',
            'true',
        );
        expect(screen.getByRole('button', { name: /khem is settled up/i })).toHaveAttribute(
            'aria-expanded',
            'false',
        );
    });

    it('only expands the first unsettled member when several are non-zero', () => {
        const threeMembers: User[] = [
            ...members,
            { id: 'friend-3', name: 'Divanshu', email: 'divanshu@example.com' },
        ];
        const multipleUnsettledBalances = new Map([
            ['friend-1', -38],
            ['friend-2', 38],
            ['friend-3', -10],
        ]);

        render(
            <GroupBalanceAccordionList
                members={threeMembers}
                netBalances={multipleUnsettledBalances}
                transactions={transactions}
            />,
        );

        expect(screen.getByRole('button', { name: /abhinav owes/i })).toHaveAttribute(
            'aria-expanded',
            'true',
        );
        expect(screen.getByRole('button', { name: /khem gets back/i })).toHaveAttribute(
            'aria-expanded',
            'false',
        );
        expect(screen.getByRole('button', { name: /divanshu owes/i })).toHaveAttribute(
            'aria-expanded',
            'false',
        );
    });

    it('always places the current user first, regardless of input order or settled status', () => {
        const membersWithCurrentUserLast: User[] = [
            { id: 'friend-1', name: 'Abhinav', email: 'abhinav@example.com' },
            { id: CURRENT_USER_ID, name: 'Utkarsh Srivastava', email: 'utkarsh@example.com' },
        ];
        const balances = new Map([
            ['friend-1', -38],
            [CURRENT_USER_ID, 0],
        ]);

        render(
            <GroupBalanceAccordionList
                members={membersWithCurrentUserLast}
                netBalances={balances}
                transactions={transactions}
            />,
        );

        const triggers = screen.getAllByRole('button');
        expect(triggers[0]).toHaveTextContent('You are settled up');
        expect(triggers[1]).toHaveTextContent('Abhinav owes');

        // Position is independent of the expand rule: the settled current user
        // leads the list but stays collapsed, while unsettled Abhinav — despite
        // now being second — is the one that expands by default.
        expect(triggers[0]).toHaveAttribute('aria-expanded', 'false');
        expect(triggers[1]).toHaveAttribute('aria-expanded', 'true');
    });

    it("shows a shared transaction under both members' accordions once both are expanded", async () => {
        // Unlike the fixture above, Khem is owed the exact amount Abhinav owes.
        // Only Abhinav (first in the member list) expands by default now, so
        // Khem's half of the shared transaction has to be opened manually before
        // it's mounted (Radix unmounts collapsed content).
        const bothNonZeroBalances = new Map([
            ['friend-1', -38],
            ['friend-2', 38],
        ]);
        const user = userEvent.setup();

        render(
            <GroupBalanceAccordionList
                members={members}
                netBalances={bothNonZeroBalances}
                transactions={transactions}
            />,
        );

        await user.click(screen.getByRole('button', { name: /khem gets back/i }));

        expect(screen.getAllByText('Abhinav owes ₹38.00 to Khem')).toHaveLength(2);
    });
});
