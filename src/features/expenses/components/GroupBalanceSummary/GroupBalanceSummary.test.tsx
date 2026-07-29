import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
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

function renderSummary() {
    return render(
        <MemoryRouter>
            <GroupBalanceSummary groupId="group-1" />
        </MemoryRouter>,
    );
}

describe('GroupBalanceSummary', () => {
    it('shows a loading skeleton while fetching', () => {
        vi.mocked(useExpenses).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useExpenses>);

        const { container } = renderSummary();

        expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });

    it('shows an error message when expenses fail to load', () => {
        vi.mocked(useExpenses).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        } as unknown as ReturnType<typeof useExpenses>);

        renderSummary();

        expect(screen.getByText(/couldn't load balance/i)).toBeInTheDocument();
    });

    it('shows "you are owed" in the owed color, with a neutral link to the balance page', () => {
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

        renderSummary();

        expect(screen.getByText(/you are owed ₹50\.00/i)).toHaveClass('text-owed');

        const link = screen.getByRole('link', { name: /click to view details/i });
        expect(link).toHaveAttribute('href', '/groups/group-1/balance');
        expect(link).not.toHaveClass('text-owed');
    });

    it('shows "you owe" in the owe color, with a neutral link to the balance page', () => {
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

        renderSummary();

        expect(screen.getByText(/you owe ₹50\.00/i)).toHaveClass('text-owe');

        const link = screen.getByRole('link', { name: /click to view details/i });
        expect(link).not.toHaveClass('text-owe');
    });

    it('shows a settled message in the settled color, with a neutral link to the balance page', () => {
        vi.mocked(useExpenses).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpenses>);

        renderSummary();

        expect(screen.getByText(/all settled up/i)).toHaveClass('text-settled');

        const link = screen.getByRole('link', { name: /click to view details/i });
        expect(link).not.toHaveClass('text-settled');
    });
});
