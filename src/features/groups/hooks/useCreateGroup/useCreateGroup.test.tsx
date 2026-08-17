import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Group } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import * as groupsApi from '@features/groups/api/groupsApi';
import { useCreateGroup } from './useCreateGroup';

vi.mock('@features/groups/api/groupsApi', () => ({
    create: vi.fn(),
}));

vi.mock('@app/hooks', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/hooks')>()),
    useCurrentUser: () => ({
        data: { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
    }),
}));

describe('useCreateGroup', () => {
    it('creates a group via the API with the current user included', async () => {
        const created: Group = {
            id: 'server-generated-id',
            name: 'Weekend Trip',
            memberIds: [CURRENT_USER_ID, 'friend-1'],
            createdAt: '2026-07-01T00:00:00.000Z',
        };
        vi.mocked(groupsApi.create).mockResolvedValue(created);

        const queryClient = new QueryClient();
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useCreateGroup(), { wrapper });

        result.current.mutate({ name: 'Weekend Trip', memberIds: ['friend-1'] });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(groupsApi.create).toHaveBeenCalledWith({
            name: 'Weekend Trip',
            memberIds: [CURRENT_USER_ID, 'friend-1'],
        });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['groups'] });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users', 'friends'] });
    });

    it('includes the current user even when no members are selected', async () => {
        vi.mocked(groupsApi.create).mockResolvedValue({
            id: 'server-generated-id',
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

        expect(groupsApi.create).toHaveBeenCalledWith(
            expect.objectContaining({ memberIds: [CURRENT_USER_ID] }),
        );
    });
});
