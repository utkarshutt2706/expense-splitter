import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@features/users/api/usersApi';
import * as usersApi from '@features/users/api/usersApi';
import { useGroupMembers } from './useGroupMembers';

vi.mock('@features/users/api/usersApi', () => ({
    getByIds: vi.fn(),
}));

function renderUseGroupMembers(memberIds: string[]) {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return renderHook(() => useGroupMembers(memberIds), { wrapper });
}

describe('useGroupMembers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('resolves member ids to user records, preserving order', async () => {
        const users: User[] = [
            { id: 'current-user', name: 'Alex Morgan', email: 'alex@example.com' },
            { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' },
            { id: 'friend-2', name: 'Jordan Lee', phone: '5551234567' },
        ];
        vi.mocked(usersApi.getByIds).mockResolvedValue(users);

        const { result } = renderUseGroupMembers(['friend-2', 'current-user']);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(usersApi.getByIds).toHaveBeenCalledWith(['friend-2', 'current-user']);
        expect(result.current.data).toEqual([users[2], users[0]]);
    });

    it('skips ids the batch response omits', async () => {
        vi.mocked(usersApi.getByIds).mockResolvedValue([]);

        const { result } = renderUseGroupMembers(['missing-user']);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual([]);
    });

    it('short-circuits to an empty list without calling the API when there are no member ids', async () => {
        const { result } = renderUseGroupMembers([]);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual([]);
        expect(usersApi.getByIds).not.toHaveBeenCalled();
    });
});
