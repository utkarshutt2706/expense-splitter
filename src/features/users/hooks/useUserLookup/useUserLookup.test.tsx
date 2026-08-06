import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import * as usersApi from '@features/users/api/usersApi';
import { ApiError } from '@lib/api/apiError';
import { useUserLookup } from './useUserLookup';

vi.mock('@features/users/api/usersApi', () => ({
    lookup: vi.fn(),
}));

function wrapperFor(queryClient: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
}

describe('useUserLookup', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('looks up a user by email', async () => {
        const user: User = { id: 'user-1', name: 'Priya Sharma', email: 'priya@example.com' };
        vi.mocked(usersApi.lookup).mockResolvedValue(user);

        const { result } = renderHook(() => useUserLookup({ email: 'priya@example.com' }), {
            wrapper: wrapperFor(new QueryClient()),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(user);
        expect(usersApi.lookup).toHaveBeenCalledWith({ email: 'priya@example.com' });
    });

    it('does not fetch when the query is null', () => {
        const { result } = renderHook(() => useUserLookup(null), {
            wrapper: wrapperFor(new QueryClient()),
        });

        expect(result.current.fetchStatus).toBe('idle');
    });

    it('does not retry a NOT_FOUND error', async () => {
        vi.mocked(usersApi.lookup).mockRejectedValue(
            new ApiError('NOT_FOUND', 'No registered user matches that email or phone', 404),
        );

        const { result } = renderHook(() => useUserLookup({ email: 'nobody@example.com' }), {
            wrapper: wrapperFor(new QueryClient()),
        });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(usersApi.lookup).toHaveBeenCalledTimes(1);
    });
});
