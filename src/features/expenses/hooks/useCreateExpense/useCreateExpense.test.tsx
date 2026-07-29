import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Expense } from '@data/entities';
import { useCreateExpense } from './useCreateExpense';

vi.mock('@services/instances', () => ({
    expenseService: {
        create: vi.fn(),
    },
}));

describe('useCreateExpense', () => {
    it('creates an expense with an equal split, paid by whoever is passed in', async () => {
        const { expenseService } = await import('@services/instances');
        const created: Expense = {
            id: 'generated-id',
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
        vi.mocked(expenseService.create).mockResolvedValue(created);

        const queryClient = new QueryClient();
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useCreateExpense(), { wrapper });

        result.current.mutate({
            groupId: 'group-1',
            description: 'Groceries',
            amount: 90,
            paidByUserId: 'user-2',
            participantUserIds: ['user-1', 'user-2', 'user-3'],
            splitType: 'equal',
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(expenseService.create).toHaveBeenCalledWith(
            expect.objectContaining({
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
            }),
        );
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['expenses', 'group-1'] });
    });

    it('creates an expense with an exact split, using the provided per-participant amounts', async () => {
        const { expenseService } = await import('@services/instances');
        const created: Expense = {
            id: 'generated-id',
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
        vi.mocked(expenseService.create).mockResolvedValue(created);

        const queryClient = new QueryClient();
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useCreateExpense(), { wrapper });

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

        expect(expenseService.create).toHaveBeenCalledWith(
            expect.objectContaining({
                splitType: 'exact',
                splits: [
                    { userId: 'user-1', amount: 50 },
                    { userId: 'user-2', amount: 40 },
                ],
            }),
        );
    });

    it('creates an expense with a percentage split, using the provided per-participant percentages', async () => {
        const { expenseService } = await import('@services/instances');
        const created: Expense = {
            id: 'generated-id',
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
        vi.mocked(expenseService.create).mockResolvedValue(created);

        const queryClient = new QueryClient();
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useCreateExpense(), { wrapper });

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

        expect(expenseService.create).toHaveBeenCalledWith(
            expect.objectContaining({
                splitType: 'percentage',
                splits: [
                    { userId: 'user-1', amount: 54 },
                    { userId: 'user-2', amount: 36 },
                ],
            }),
        );
    });

    it('creates an expense with a shares split, using the provided per-participant share counts', async () => {
        const { expenseService } = await import('@services/instances');
        const created: Expense = {
            id: 'generated-id',
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
        vi.mocked(expenseService.create).mockResolvedValue(created);

        const queryClient = new QueryClient();
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useCreateExpense(), { wrapper });

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

        expect(expenseService.create).toHaveBeenCalledWith(
            expect.objectContaining({
                splitType: 'shares',
                splits: [
                    { userId: 'user-1', amount: 60 },
                    { userId: 'user-2', amount: 30 },
                ],
            }),
        );
    });
});
