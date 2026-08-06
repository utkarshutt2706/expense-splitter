import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Group } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import * as groupsApi from '@features/groups/api/groupsApi';
import * as invitationsApi from '@features/invitations/api/invitationsApi';
import { useCreateGroup } from './useCreateGroup';

vi.mock('@features/groups/api/groupsApi', () => ({
    create: vi.fn(),
}));

vi.mock('@features/invitations/api/invitationsApi', () => ({
    create: vi.fn(),
}));

vi.mock('@app/hooks', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/hooks')>()),
    useCurrentUser: () => ({
        data: { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
    }),
}));

function wrapperFor(queryClient: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
}

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

        const { result } = renderHook(() => useCreateGroup(), { wrapper: wrapperFor(queryClient) });

        result.current.mutate({ name: 'Weekend Trip', memberIds: ['friend-1'], inviteEmails: [] });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(groupsApi.create).toHaveBeenCalledWith({
            name: 'Weekend Trip',
            memberIds: [CURRENT_USER_ID, 'friend-1'],
        });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['groups'] });
        expect(result.current.data).toEqual({ group: created, failedInviteEmails: [] });
    });

    it('includes the current user even when no members are selected', async () => {
        vi.mocked(groupsApi.create).mockResolvedValue({
            id: 'server-generated-id',
            name: 'Solo Group',
            memberIds: [CURRENT_USER_ID],
            createdAt: '2026-07-01T00:00:00.000Z',
        });

        const { result } = renderHook(() => useCreateGroup(), {
            wrapper: wrapperFor(new QueryClient()),
        });

        result.current.mutate({ name: 'Solo Group', memberIds: [], inviteEmails: [] });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(groupsApi.create).toHaveBeenCalledWith(
            expect.objectContaining({ memberIds: [CURRENT_USER_ID] }),
        );
    });

    it('invites each pending email once the group exists', async () => {
        const created: Group = {
            id: 'server-generated-id',
            name: 'Weekend Trip',
            memberIds: [CURRENT_USER_ID],
            createdAt: '2026-07-01T00:00:00.000Z',
        };
        vi.mocked(groupsApi.create).mockResolvedValue(created);
        vi.mocked(invitationsApi.create).mockResolvedValue({
            id: 'invitation-1',
            groupId: created.id,
            email: 'jamie@example.com',
            status: 'pending',
            expiresAt: '2026-08-13T00:00:00.000Z',
        });

        const { result } = renderHook(() => useCreateGroup(), {
            wrapper: wrapperFor(new QueryClient()),
        });

        result.current.mutate({
            name: 'Weekend Trip',
            memberIds: [],
            inviteEmails: ['jamie@example.com'],
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(invitationsApi.create).toHaveBeenCalledWith(
            'server-generated-id',
            'jamie@example.com',
        );
        expect(result.current.data).toEqual({ group: created, failedInviteEmails: [] });
    });

    it('reports emails whose invite failed without failing the whole mutation', async () => {
        const created: Group = {
            id: 'server-generated-id',
            name: 'Weekend Trip',
            memberIds: [CURRENT_USER_ID],
            createdAt: '2026-07-01T00:00:00.000Z',
        };
        vi.mocked(groupsApi.create).mockResolvedValue(created);
        vi.mocked(invitationsApi.create).mockImplementation((_groupId, email) =>
            email === 'jamie@example.com'
                ? Promise.reject(new Error('email already registered'))
                : Promise.resolve({
                      id: 'invitation-2',
                      groupId: created.id,
                      email,
                      status: 'pending',
                      expiresAt: '2026-08-13T00:00:00.000Z',
                  }),
        );

        const { result } = renderHook(() => useCreateGroup(), {
            wrapper: wrapperFor(new QueryClient()),
        });

        result.current.mutate({
            name: 'Weekend Trip',
            memberIds: [],
            inviteEmails: ['jamie@example.com', 'sam@example.com'],
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual({
            group: created,
            failedInviteEmails: ['jamie@example.com'],
        });
    });
});
