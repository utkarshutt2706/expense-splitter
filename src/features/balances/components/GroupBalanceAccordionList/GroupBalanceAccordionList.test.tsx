import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import type { SettlementTransaction } from '@features/balances/api/balancesApi';
import { GroupBalanceAccordionList } from './GroupBalanceAccordionList';

vi.mock('@app/hooks', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/hooks')>()),
    useCurrentUser: () => ({ data: { id: CURRENT_USER_ID, name: 'Utkarsh' } }),
}));
vi.mock('@features/payments/hooks/useCreatePayment', () => ({
    useCreatePayment: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@features/payments/components/RecordPaymentDialog', () => ({
    RecordPaymentDialog: ({
        open,
        initialValues,
    }: {
        open: boolean;
        initialValues?: SettlementTransaction;
    }) => (open ? <div data-testid="payment-dialog">{JSON.stringify(initialValues)}</div> : null),
}));

const members: User[] = [
    { id: CURRENT_USER_ID, name: 'Utkarsh', email: 'u@example.com' },
    { id: 'jayant', name: 'Jayant Sachan', email: 'j@example.com' },
    { id: 'shivam', name: 'Shivam Rajput', email: 's@example.com' },
    { id: 'rohan', name: 'Rohan Dwivedi', email: 'r@example.com' },
    { id: 'settled', name: 'Sibali Singh', email: 'ss@example.com' },
];

function renderList(transactions: SettlementTransaction[], balances = new Map<string, number>()) {
    return render(
        <GroupBalanceAccordionList
            groupId="group-1"
            members={members}
            netBalances={balances}
            transactions={transactions}
        />,
    );
}

describe('GroupBalanceAccordionList', () => {
    it('shows a receive-only position and personal settlement', () => {
        renderList(
            [{ fromUserId: 'jayant', toUserId: CURRENT_USER_ID, amount: 9388.09 }],
            new Map([[CURRENT_USER_ID, 9388.09]]),
        );

        expect(screen.getByText('You are owed ₹9,388.09')).toBeInTheDocument();
        expect(screen.getByText('1 payment to receive')).toBeInTheDocument();
        expect(screen.getByText('Jayant Sachan owes you')).toBeInTheDocument();
    });

    it('shows an owe-only position and correct direction', () => {
        renderList(
            [{ fromUserId: CURRENT_USER_ID, toUserId: 'shivam', amount: 2500 }],
            new Map([[CURRENT_USER_ID, -2500]]),
        );

        expect(screen.getByText('You owe ₹2,500.00')).toBeInTheDocument();
        const direction = screen.getByText(/You owe Shivam Rajput/);
        expect(direction).toHaveTextContent('You owe Shivam Rajput ₹2,500.00');
        expect(direction.querySelector('span')).toHaveClass('text-owe');
        expect(screen.getByText('You need to make this payment.')).toBeInTheDocument();
        expect(direction.closest('ul')?.parentElement).toHaveClass('rounded-xl', 'border');
        expect(
            screen.getByRole('button', { name: /settle up: you owe shivam rajput/i }).parentElement,
        ).toHaveClass('shrink-0');
    });

    it('shows gross mixed obligations and a secondary net position', () => {
        renderList(
            [
                { fromUserId: 'jayant', toUserId: CURRENT_USER_ID, amount: 12000 },
                { fromUserId: CURRENT_USER_ID, toUserId: 'shivam', amount: 2611.91 },
            ],
            new Map([[CURRENT_USER_ID, 9388.09]]),
        );

        expect(screen.getByText('To receive').nextSibling).toHaveTextContent('₹12,000.00');
        expect(screen.getByText('To pay').nextSibling).toHaveTextContent('₹2,611.91');
        expect(screen.getByText(/₹9,388\.09 to receive/)).toBeInTheDocument();
        const rows = screen.getAllByRole('listitem');
        expect(rows[0]).toHaveTextContent('You owe Shivam Rajput');
        expect(rows[1]).toHaveTextContent('Jayant Sachan owes you');
    });

    it('shows personal settled state while other balances remain collapsed', () => {
        renderList(
            [{ fromUserId: 'jayant', toUserId: 'rohan', amount: 14065.11 }],
            new Map([
                [CURRENT_USER_ID, 0],
                ['jayant', -14065.11],
                ['rohan', 14065.11],
            ]),
        );

        expect(screen.getByText('You are settled up')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /other group balances \(1\)/i })).toHaveAttribute(
            'aria-expanded',
            'false',
        );
        expect(screen.queryByText(/jayant sachan owes rohan/i)).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /settled participants \(0\)/i }),
        ).not.toBeInTheDocument();
    });

    it('omits empty balance disclosures', () => {
        renderList(
            [{ fromUserId: CURRENT_USER_ID, toUserId: 'shivam', amount: 2500 }],
            new Map([
                [CURRENT_USER_ID, -2500],
                ['shivam', 2500],
            ]),
        );

        expect(
            screen.queryByRole('button', { name: /other group balances \(0\)/i }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /settled participants \(0\)/i }),
        ).not.toBeInTheDocument();
    });

    it('displays every canonical recommendation exactly once', async () => {
        const user = userEvent.setup();
        renderList(
            [
                { fromUserId: 'jayant', toUserId: CURRENT_USER_ID, amount: 9388.09 },
                { fromUserId: 'jayant', toUserId: 'rohan', amount: 14065.11 },
            ],
            new Map([[CURRENT_USER_ID, 9388.09]]),
        );

        await user.click(screen.getByRole('button', { name: /other group balances \(1\)/i }));
        expect(screen.getAllByText('Jayant Sachan owes you')).toHaveLength(1);
        const otherBalance = screen.getByText(/Jayant Sachan owes Rohan Dwivedi/);
        expect(otherBalance).toHaveTextContent('Jayant Sachan owes Rohan Dwivedi ₹14,065.11');
        expect(otherBalance.querySelector('span')).toHaveClass('text-owe');
    });

    it('shows compact settled participants through a collapsed disclosure', async () => {
        const user = userEvent.setup();
        renderList([], new Map(members.map((member) => [member.id, 0])));

        expect(screen.getByText('Everyone is settled up')).toBeInTheDocument();
        const disclosure = screen.getByRole('button', { name: /settled participants \(4\)/i });
        expect(disclosure).toHaveAttribute('aria-expanded', 'false');
        await user.click(disclosure);
        expect(screen.getByText('Sibali Singh')).toBeInTheDocument();
        expect(screen.queryByText('No settlements needed.')).not.toBeInTheDocument();
    });

    it('passes the selected canonical transaction to Settle up', async () => {
        const user = userEvent.setup();
        const transaction = { fromUserId: 'jayant', toUserId: CURRENT_USER_ID, amount: 9388.09 };
        renderList([transaction], new Map([[CURRENT_USER_ID, 9388.09]]));

        await user.click(
            screen.getByRole('button', { name: /settle up: jayant sachan owes you/i }),
        );

        expect(screen.getByTestId('payment-dialog')).toHaveTextContent(JSON.stringify(transaction));
    });

    it('lists settled participants alphabetically', async () => {
        const user = userEvent.setup();
        renderList(
            [{ fromUserId: 'jayant', toUserId: CURRENT_USER_ID, amount: 100 }],
            new Map([
                [CURRENT_USER_ID, 100],
                ['jayant', -100],
                ['shivam', 0],
                ['settled', 0],
                ['rohan', 0],
            ]),
        );

        await user.click(screen.getByRole('button', { name: /settled participants/i }));

        const names = screen
            .getAllByText(/settled up/i)
            .map((node) => node.previousElementSibling?.textContent)
            .filter(Boolean);
        expect(names).toEqual(['Rohan Dwivedi', 'Shivam Rajput', 'Sibali Singh']);
    });

    it('orders balances between other people by who owes, then by who is owed', async () => {
        const user = userEvent.setup();
        renderList(
            [
                { fromUserId: 'shivam', toUserId: 'rohan', amount: 100 },
                { fromUserId: 'jayant', toUserId: 'shivam', amount: 200 },
                { fromUserId: 'jayant', toUserId: 'rohan', amount: 300 },
            ],
            new Map([['jayant', -500]]),
        );

        await user.click(screen.getByRole('button', { name: /other group balances/i }));

        const sentences = screen
            .getAllByRole('button', { name: /^settle up:/i })
            .map((button) => button.getAttribute('aria-label'));
        expect(sentences).toEqual([
            'Settle up: Jayant Sachan owes Rohan Dwivedi ₹300.00',
            'Settle up: Jayant Sachan owes Shivam Rajput ₹200.00',
            'Settle up: Shivam Rajput owes Rohan Dwivedi ₹100.00',
        ]);
    });
});
