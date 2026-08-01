import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Expense, Payment, User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { useExpenses } from '@features/expenses/hooks/useExpenses';
import { usePayments } from '@features/payments';
import { GroupBalanceSummary } from './GroupBalanceSummary';

vi.mock('@features/expenses/hooks/useExpenses', () => ({
    useExpenses: vi.fn(),
}));

vi.mock('@features/payments', () => ({
    usePayments: vi.fn(),
}));

vi.mock('@app/hooks', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/hooks')>()),
    useCurrentUser: () => ({
        data: { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
    }),
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

function payment(overrides: Partial<Payment>): Payment {
    return {
        id: 'payment-1',
        groupId: 'group-1',
        fromUserId: CURRENT_USER_ID,
        toUserId: 'friend-1',
        amount: 25,
        createdAt: '2026-07-02T00:00:00.000Z',
        ...overrides,
    };
}

const defaultMembers: User[] = [
    { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
    { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' },
];

function renderSummary(members: User[] = defaultMembers) {
    return render(
        <MemoryRouter>
            <GroupBalanceSummary groupId="group-1" members={members} />
        </MemoryRouter>,
    );
}

describe('GroupBalanceSummary', () => {
    beforeEach(() => {
        vi.mocked(usePayments).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof usePayments>);
    });

    it('shows a loading skeleton while fetching', () => {
        vi.mocked(useExpenses).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useExpenses>);

        const { container } = renderSummary();

        expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });

    it('shows a loading skeleton while payments are still fetching', () => {
        vi.mocked(useExpenses).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpenses>);
        vi.mocked(usePayments).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof usePayments>);

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

    it('shows an error message when payments fail to load', () => {
        vi.mocked(useExpenses).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpenses>);
        vi.mocked(usePayments).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        } as unknown as ReturnType<typeof usePayments>);

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

    it('shows a settled message and a celebratory note instead of a link when the whole group is settled', () => {
        vi.mocked(useExpenses).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpenses>);

        renderSummary();

        expect(screen.getByText(/all settled up/i)).toHaveClass('text-settled');
        expect(screen.getByText(/this group is all settled/i)).toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('still links to the balance page when the current user is settled but another member is not', () => {
        vi.mocked(useExpenses).mockReturnValue({
            data: [
                expense({
                    paidByUserId: 'friend-1',
                    splits: [
                        { userId: 'friend-1', amount: 50 },
                        { userId: 'friend-2', amount: 50 },
                    ],
                }),
            ],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useExpenses>);

        renderSummary([
            ...defaultMembers,
            { id: 'friend-2', name: 'Khem', email: 'khem@example.com' },
        ]);

        expect(screen.getByText(/all settled up/i)).toHaveClass('text-settled');

        const link = screen.getByRole('link', { name: /click to view details/i });
        expect(link).toHaveAttribute('href', '/groups/group-1/balance');
        expect(screen.queryByText(/this group is all settled/i)).not.toBeInTheDocument();
    });

    it('folds a recorded payment into the displayed balance', () => {
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
        vi.mocked(usePayments).mockReturnValue({
            data: [payment({ fromUserId: CURRENT_USER_ID, toUserId: 'friend-1', amount: 50 })],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof usePayments>);

        renderSummary();

        expect(screen.getByText(/all settled up/i)).toHaveClass('text-settled');
    });
});
