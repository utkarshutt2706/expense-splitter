import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SettlementTransaction } from '@features/balances/api/balancesApi';
import { SettlementTransactionList } from './SettlementTransactionList';

const items: SettlementTransaction[] = [
    { fromUserId: 'current', toUserId: 'alex', amount: 20 },
    { fromUserId: 'alex', toUserId: 'current', amount: 15 },
    { fromUserId: 'alex', toUserId: 'sam', amount: 5 },
];
const names = new Map([
    ['current', 'You'],
    ['alex', 'Alex'],
    ['sam', 'Sam'],
]);

describe('SettlementTransactionList', () => {
    it('renders payment directions, amounts, and personal guidance', () => {
        render(
            <SettlementTransactionList
                currentUserId="current"
                items={items}
                nameFor={(id) => names.get(id)!}
                onSettle={vi.fn()}
            />,
        );
        expect(screen.getByText(/You owe Alex/)).toHaveTextContent('₹20.00');
        expect(screen.getByText('You need to make this payment.')).toBeInTheDocument();
        expect(screen.getByText(/Alex owes You/)).toHaveTextContent('₹15.00');
        expect(screen.getByText('You will receive this payment.')).toBeInTheDocument();
        expect(screen.getByText(/Alex owes Sam/)).toHaveTextContent('₹5.00');
    });

    it('passes the selected transaction and button trigger to settlement', () => {
        const onSettle = vi.fn();
        render(
            <SettlementTransactionList
                currentUserId="current"
                items={[items[0]!]}
                nameFor={(id) => names.get(id)!}
                onSettle={onSettle}
            />,
        );
        const button = screen.getByRole('button', { name: 'Settle up: You owe Alex ₹20.00' });
        fireEvent.click(button);
        expect(onSettle).toHaveBeenCalledWith(items[0], button);
    });

    it('renders an empty list for no transactions', () => {
        const { container } = render(
            <SettlementTransactionList items={[]} nameFor={() => ''} onSettle={vi.fn()} />,
        );
        expect(container.querySelectorAll('li')).toHaveLength(0);
    });
});
