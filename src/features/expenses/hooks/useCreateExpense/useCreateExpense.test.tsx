import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Expense } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { useCreateExpense } from './useCreateExpense';

vi.mock('@services/instances', () => ({
    expenseService: {
        create: vi.fn(),
    },
}));

describe('useCreateExpense', () => {
    it('creates an expense with an equal split, paid by the current user', async () => {
        const { expenseService } = await import('@services/instances');
        const created: Expense = {
            id: 'generated-id',
            groupId: 'group-1',
            description: 'Groceries',
            amount: 90,
            paidByUserId: CURRENT_USER_ID,
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
            participantUserIds: ['user-1', 'user-2', 'user-3'],
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(expenseService.create).toHaveBeenCalledWith(
            expect.objectContaining({
                groupId: 'group-1',
                description: 'Groceries',
                amount: 90,
                paidByUserId: CURRENT_USER_ID,
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
});
