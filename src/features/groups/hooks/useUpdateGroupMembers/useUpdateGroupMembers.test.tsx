import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Group } from '@data/entities';
import * as groupsApi from '@features/groups/api/groupsApi';
import * as invitationsApi from '@features/invitations/api/invitationsApi';
import { useUpdateGroupMembers } from './useUpdateGroupMembers';

vi.mock('@features/groups/api/groupsApi', () => ({
    update: vi.fn(),
}));

vi.mock('@features/invitations/api/invitationsApi', () => ({
    create: vi.fn(),
}));

function wrapperFor(queryClient: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
}

describe('useUpdateGroupMembers', () => {
    it('updates a group via the API and invalidates the groups queries', async () => {
        const updated: Group = {
            id: 'group-1',
            name: 'Ski Trip',
            memberIds: ['current-user', 'friend-1'],
            createdAt: '2026-07-01T00:00:00.000Z',
        };
        vi.mocked(groupsApi.update).mockResolvedValue(updated);

        const queryClient = new QueryClient();
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        const { result } = renderHook(() => useUpdateGroupMembers(), {
            wrapper: wrapperFor(queryClient),
        });

        result.current.mutate({
            id: 'group-1',
            memberIds: ['current-user', 'friend-1'],
            inviteEmails: [],
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(groupsApi.update).toHaveBeenCalledWith('group-1', {
            memberIds: ['current-user', 'friend-1'],
        });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['groups'] });
        expect(result.current.data).toEqual({ group: updated, failedInviteEmails: [] });
    });

    it('invites each pending email against the existing group', async () => {
        const updated: Group = {
            id: 'group-1',
            name: 'Ski Trip',
            memberIds: ['current-user'],
            createdAt: '2026-07-01T00:00:00.000Z',
        };
        vi.mocked(groupsApi.update).mockResolvedValue(updated);
        vi.mocked(invitationsApi.create).mockResolvedValue({
            id: 'invitation-1',
            groupId: 'group-1',
            email: 'jamie@example.com',
            status: 'pending',
            expiresAt: '2026-08-13T00:00:00.000Z',
        });

        const { result } = renderHook(() => useUpdateGroupMembers(), {
            wrapper: wrapperFor(new QueryClient()),
        });

        result.current.mutate({
            id: 'group-1',
            memberIds: ['current-user'],
            inviteEmails: ['jamie@example.com'],
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(invitationsApi.create).toHaveBeenCalledWith('group-1', 'jamie@example.com');
        expect(result.current.data).toEqual({ group: updated, failedInviteEmails: [] });
    });

    it('reports emails whose invite failed without failing the whole mutation', async () => {
        const updated: Group = {
            id: 'group-1',
            name: 'Ski Trip',
            memberIds: ['current-user'],
            createdAt: '2026-07-01T00:00:00.000Z',
        };
        vi.mocked(groupsApi.update).mockResolvedValue(updated);
        vi.mocked(invitationsApi.create).mockImplementation((_groupId, email) =>
            email === 'jamie@example.com'
                ? Promise.reject(new Error('email already registered'))
                : Promise.resolve({
                      id: 'invitation-2',
                      groupId: 'group-1',
                      email,
                      status: 'pending',
                      expiresAt: '2026-08-13T00:00:00.000Z',
                  }),
        );

        const { result } = renderHook(() => useUpdateGroupMembers(), {
            wrapper: wrapperFor(new QueryClient()),
        });

        result.current.mutate({
            id: 'group-1',
            memberIds: ['current-user'],
            inviteEmails: ['jamie@example.com', 'sam@example.com'],
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual({
            group: updated,
            failedInviteEmails: ['jamie@example.com'],
        });
    });
});
