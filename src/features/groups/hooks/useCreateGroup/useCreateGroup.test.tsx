import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Group } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { useCreateGroup } from './useCreateGroup';

vi.mock('@services/instances', () => ({
    groupService: {
        create: vi.fn(),
    },
}));

vi.mock('@app/hooks', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/hooks')>()),
    useCurrentUser: () => ({
        data: { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
    }),
}));

describe('useCreateGroup', () => {
    it('creates a group with a generated id, timestamp, and the current user included', async () => {
        const { groupService } = await import('@services/instances');
        const created: Group = {
            id: 'generated-id',
            name: 'Weekend Trip',
            memberIds: [CURRENT_USER_ID, 'friend-1'],
            createdAt: '2026-07-01T00:00:00.000Z',
        };
        vi.mocked(groupService.create).mockResolvedValue(created);

        const queryClient = new QueryClient();
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useCreateGroup(), { wrapper });

        result.current.mutate({ name: 'Weekend Trip', memberIds: ['friend-1'] });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(groupService.create).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Weekend Trip',
                memberIds: [CURRENT_USER_ID, 'friend-1'],
            }),
        );
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['groups'] });
    });

    it('includes the current user even when no members are selected', async () => {
        const { groupService } = await import('@services/instances');
        vi.mocked(groupService.create).mockResolvedValue({
            id: 'generated-id',
            name: 'Solo Group',
            memberIds: [CURRENT_USER_ID],
            createdAt: '2026-07-01T00:00:00.000Z',
        });

        const queryClient = new QueryClient();
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useCreateGroup(), { wrapper });

        result.current.mutate({ name: 'Solo Group', memberIds: [] });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(groupService.create).toHaveBeenCalledWith(
            expect.objectContaining({ memberIds: [CURRENT_USER_ID] }),
        );
    });
});
