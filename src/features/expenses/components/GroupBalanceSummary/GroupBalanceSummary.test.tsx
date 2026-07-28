import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Expense } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { useExpenses } from '@features/expenses/hooks/useExpenses';
import { GroupBalanceSummary } from './GroupBalanceSummary';

vi.mock('@features/expenses/hooks/useExpenses', () => ({
    useExpenses: vi.fn(),
}));

function expense(overrides: Partial<Expense>): Expense {
    return {
        id: 'expense-1',
        groupId: 'group-1',
        description: 'Groceries',
        amount: 100,
        paidByUserId: CURRENT_USER_ID,
        splitType: 'equal',
        splits: [],
        createdAt: '2026-07-01T00:00:00.000Z',
        ...overrides,
    };
}

describe('GroupBalanceSummary', () => {
    it('shows a loading skeleton while fetching', () => {
        vi.mocked(useExpenses).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useExpenses>);

        const { container } = render(<GroupBalanceSummary groupId="group-1" />);

        expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });

    it('shows an error message when expenses fail to load', () => {
        vi.mocked(useExpenses).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        } as unknown as ReturnType<typeof useExpenses>);

        render(<GroupBalanceSummary groupId="group-1" />);

        expect(screen.getByText(/couldn't load balance/i)).toBeInTheDocument();
    });

    it('shows "you are owed" in the owed color when the balance is positive', () => {
        vi.mocked(useExpenses).mockReturnValue({
            data: [
                expense({
                    paidByUserId: CURRENT_USER_ID,
                    splits: [
                        { userId: CURRENT_USER_ID, amount: 50 },
                        { userId: 'friend-1', amount: 50 },
                    ],
                }),
            ],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpenses>);

        render(<GroupBalanceSummary groupId="group-1" />);

        const message = screen.getByText(/you are owed ₹50\.00/i);
        expect(message).toBeInTheDocument();
        expect(message).toHaveClass('text-owed');
    });

    it('shows "you owe" in the owe color when the balance is negative', () => {
        vi.mocked(useExpenses).mockReturnValue({
            data: [
                expense({
                    paidByUserId: 'friend-1',
                    splits: [
                        { userId: CURRENT_USER_ID, amount: 50 },
                        { userId: 'friend-1', amount: 50 },
                    ],
                }),
            ],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpenses>);

        render(<GroupBalanceSummary groupId="group-1" />);

        const message = screen.getByText(/you owe ₹50\.00/i);
        expect(message).toBeInTheDocument();
        expect(message).toHaveClass('text-owe');
    });

    it('shows a settled message in the settled color when the balance is zero', () => {
        vi.mocked(useExpenses).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpenses>);

        render(<GroupBalanceSummary groupId="group-1" />);

        const message = screen.getByText(/all settled up/i);
        expect(message).toBeInTheDocument();
        expect(message).toHaveClass('text-settled');
    });
});
