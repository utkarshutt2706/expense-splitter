import * as Accordion from '@radix-ui/react-accordion';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import type { SettlementTransaction } from '../../utils/simplifyDebts';
import { MemberBalanceAccordion } from './MemberBalanceAccordion';

const abhinav: User = { id: 'friend-1', name: 'Abhinav', email: 'abhinav@example.com' };
const khem: User = { id: 'friend-2', name: 'Khem', email: 'khem@example.com' };
const currentUser: User = {
    id: CURRENT_USER_ID,
    name: 'Utkarsh Srivastava',
    email: 'u@example.com',
};

const membersById = new Map([
    [abhinav.id, abhinav],
    [khem.id, khem],
    [currentUser.id, currentUser],
]);

function renderAccordion(
    member: User,
    netAmount: number,
    transactions: SettlementTransaction[],
    defaultValue: string[] = [],
) {
    return render(
        <Accordion.Root type="multiple" defaultValue={defaultValue}>
            <MemberBalanceAccordion
                member={member}
                netAmount={netAmount}
                transactions={transactions}
                membersById={membersById}
                currentUserId={CURRENT_USER_ID}
            />
        </Accordion.Root>,
    );
}

describe('MemberBalanceAccordion', () => {
    it('shows "gets back" in the owed color for a third-party member with a positive net', () => {
        renderAccordion(khem, 422.5, []);

        const trigger = screen.getByRole('button', { name: /khem gets back ₹422\.50 in total/i });
        expect(trigger).toHaveClass('text-owed');
    });

    it('shows "owes" in the owe color for a third-party member with a negative net', () => {
        renderAccordion(abhinav, -38, []);

        const trigger = screen.getByRole('button', { name: /abhinav owes ₹38\.00 in total/i });
        expect(trigger).toHaveClass('text-owe');
    });

    it('shows a settled message for a third-party member with a zero net', () => {
        renderAccordion(abhinav, 0, []);

        expect(screen.getByRole('button', { name: /abhinav is settled up/i })).toHaveClass(
            'text-settled',
        );
    });

    it('uses "You"/"get"/"are" grammar for the current user\'s own row', () => {
        renderAccordion(currentUser, 50, []);

        expect(
            screen.getByRole('button', { name: /^you get back ₹50\.00 in total$/i }),
        ).toBeInTheDocument();
    });

    it('is collapsed by default unless included in defaultValue', () => {
        renderAccordion(abhinav, 0, []);

        expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    });

    it('is expanded by default when included in defaultValue', () => {
        renderAccordion(abhinav, -38, [], [abhinav.id]);

        expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    });

    it('lists each settlement transaction with "You" substituted for the current user', () => {
        renderAccordion(
            abhinav,
            -38,
            [{ fromUserId: CURRENT_USER_ID, toUserId: abhinav.id, amount: 38 }],
            [abhinav.id],
        );

        expect(screen.getByText('You owe ₹38.00 to Abhinav')).toBeInTheDocument();
    });

    it('lowercases "you" when the current user is the object of the sentence', () => {
        renderAccordion(
            abhinav,
            38,
            [{ fromUserId: abhinav.id, toUserId: CURRENT_USER_ID, amount: 38 }],
            [abhinav.id],
        );

        expect(screen.getByText('Abhinav owes ₹38.00 to you')).toBeInTheDocument();
    });

    it('shows a fallback message when there are no settlement transactions', () => {
        renderAccordion(abhinav, 0, [], [abhinav.id]);

        expect(screen.getByText(/no settlements needed/i)).toBeInTheDocument();
    });
});
