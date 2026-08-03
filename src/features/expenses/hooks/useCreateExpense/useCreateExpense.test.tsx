import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Expense } from '@data/entities';
import * as expensesApi from '@features/expenses/api/expensesApi';
import { useCreateExpense } from './useCreateExpense';

vi.mock('@features/expenses/api/expensesApi', () => ({
    create: vi.fn(),
}));

function renderCreateExpense() {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return { ...renderHook(() => useCreateExpense(), { wrapper }), invalidateSpy };
}

describe('useCreateExpense', () => {
    it('creates an expense with an equal split, paid by whoever is passed in', async () => {
        const created: Expense = {
            id: 'server-generated-id',
            groupId: 'group-1',
            description: 'Groceries',
            amount: 90,
            paidByUserId: 'user-2',
            splitType: 'equal',
            splits: [
                { userId: 'user-1', amount: 30 },
                { userId: 'user-2', amount: 30 },
                { userId: 'user-3', amount: 30 },
            ],
            createdAt: '2026-07-01T00:00:00.000Z',
        };
        vi.mocked(expensesApi.create).mockResolvedValue(created);

        const { result, invalidateSpy } = renderCreateExpense();

        result.current.mutate({
            groupId: 'group-1',
            description: 'Groceries',
            amount: 90,
            paidByUserId: 'user-2',
            participantUserIds: ['user-1', 'user-2', 'user-3'],
            splitType: 'equal',
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(expensesApi.create).toHaveBeenCalledWith('group-1', {
            description: 'Groceries',
            amount: 90,
            paidByUserId: 'user-2',
            splitType: 'equal',
            splits: [
                { userId: 'user-1', amount: 30 },
                { userId: 'user-2', amount: 30 },
                { userId: 'user-3', amount: 30 },
            ],
        });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['expenses', 'group-1'] });
    });

    it('creates an expense with an exact split, using the provided per-participant amounts', async () => {
        const created: Expense = {
            id: 'server-generated-id',
            groupId: 'group-1',
            description: 'Groceries',
            amount: 90,
            paidByUserId: 'user-2',
            splitType: 'exact',
            splits: [
                { userId: 'user-1', amount: 50 },
                { userId: 'user-2', amount: 40 },
            ],
            createdAt: '2026-07-01T00:00:00.000Z',
        };
        vi.mocked(expensesApi.create).mockResolvedValue(created);

        const { result } = renderCreateExpense();

        result.current.mutate({
            groupId: 'group-1',
            description: 'Groceries',
            amount: 90,
            paidByUserId: 'user-2',
            participantUserIds: ['user-1', 'user-2'],
            splitType: 'exact',
            exactSplits: [
                { userId: 'user-1', amount: 50 },
                { userId: 'user-2', amount: 40 },
            ],
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(expensesApi.create).toHaveBeenCalledWith(
            'group-1',
            expect.objectContaining({
                splitType: 'exact',
                splits: [
                    { userId: 'user-1', amount: 50 },
                    { userId: 'user-2', amount: 40 },
                ],
            }),
        );
        const [, body] = vi.mocked(expensesApi.create).mock.calls[0]!;
        expect(body).not.toHaveProperty('percentages');
        expect(body).not.toHaveProperty('shares');
    });

    it('creates an expense with a percentage split, forwarding both the computed splits and the raw percentages', async () => {
        const created: Expense = {
            id: 'server-generated-id',
            groupId: 'group-1',
            description: 'Groceries',
            amount: 90,
            paidByUserId: 'user-2',
            splitType: 'percentage',
            splits: [
                { userId: 'user-1', amount: 54 },
                { userId: 'user-2', amount: 36 },
            ],
            createdAt: '2026-07-01T00:00:00.000Z',
        };
        vi.mocked(expensesApi.create).mockResolvedValue(created);

        const { result } = renderCreateExpense();

        result.current.mutate({
            groupId: 'group-1',
            description: 'Groceries',
            amount: 90,
            paidByUserId: 'user-2',
            participantUserIds: ['user-1', 'user-2'],
            splitType: 'percentage',
            percentageSplits: [
                { userId: 'user-1', percentage: 60 },
                { userId: 'user-2', percentage: 40 },
            ],
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(expensesApi.create).toHaveBeenCalledWith(
            'group-1',
            expect.objectContaining({
                splitType: 'percentage',
                splits: [
                    { userId: 'user-1', amount: 54 },
                    { userId: 'user-2', amount: 36 },
                ],
                percentages: [
                    { userId: 'user-1', percentage: 60 },
                    { userId: 'user-2', percentage: 40 },
                ],
            }),
        );
    });

    it('creates an expense with a shares split, forwarding both the computed splits and the raw share counts', async () => {
        const created: Expense = {
            id: 'server-generated-id',
            groupId: 'group-1',
            description: 'Groceries',
            amount: 90,
            paidByUserId: 'user-2',
            splitType: 'shares',
            splits: [
                { userId: 'user-1', amount: 60 },
                { userId: 'user-2', amount: 30 },
            ],
            createdAt: '2026-07-01T00:00:00.000Z',
        };
        vi.mocked(expensesApi.create).mockResolvedValue(created);

        const { result } = renderCreateExpense();

        result.current.mutate({
            groupId: 'group-1',
            description: 'Groceries',
            amount: 90,
            paidByUserId: 'user-2',
            participantUserIds: ['user-1', 'user-2'],
            splitType: 'shares',
            sharesSplits: [
                { userId: 'user-1', shares: 2 },
                { userId: 'user-2', shares: 1 },
            ],
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(expensesApi.create).toHaveBeenCalledWith(
            'group-1',
            expect.objectContaining({
                splitType: 'shares',
                splits: [
                    { userId: 'user-1', amount: 60 },
                    { userId: 'user-2', amount: 30 },
                ],
                shares: [
                    { userId: 'user-1', shares: 2 },
                    { userId: 'user-2', shares: 1 },
                ],
            }),
        );
    });
});
