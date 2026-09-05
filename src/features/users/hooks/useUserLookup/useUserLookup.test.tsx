import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@features/users/api/usersApi';
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
        vi.resetAllMocks();
    });

    it('looks up users by a search query', async () => {
        const users: User[] = [{ id: 'user-1', name: 'Priya Sharma', email: 'priya@example.com' }];
        vi.mocked(usersApi.lookup).mockResolvedValue(users);

        const { result } = renderHook(() => useUserLookup({ query: 'priya' }), {
            wrapper: wrapperFor(new QueryClient()),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(users);
        expect(usersApi.lookup).toHaveBeenCalledWith({ query: 'priya' });
    });

    it.each([
        ['null', null],
        ['empty', { query: '' }],
        ['whitespace-only', { query: ' \t\n ' }],
        ['one-character', { query: 'p' }],
        ['two-character with surrounding whitespace', { query: ' pR ' }],
    ] as const)('does not fetch for a %s query', (_description, query) => {
        const { result } = renderHook(() => useUserLookup(query), {
            wrapper: wrapperFor(new QueryClient()),
        });

        expect(result.current.fetchStatus).toBe('idle');
        expect(usersApi.lookup).not.toHaveBeenCalled();
    });

    it('fetches at the three-character lookup boundary', async () => {
        vi.mocked(usersApi.lookup).mockResolvedValue([]);

        const { result } = renderHook(() => useUserLookup({ query: 'pRi' }), {
            wrapper: wrapperFor(new QueryClient()),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(usersApi.lookup).toHaveBeenCalledWith({ query: 'pRi' });
    });

    it('does not retry a NOT_FOUND error', async () => {
        vi.mocked(usersApi.lookup).mockRejectedValue(
            new ApiError('NOT_FOUND', 'No registered user matches that query', 404),
        );

        const { result } = renderHook(() => useUserLookup({ query: 'nobody' }), {
            wrapper: wrapperFor(new QueryClient()),
        });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(usersApi.lookup).toHaveBeenCalledTimes(1);
        expect(result.current.error).toBeInstanceOf(ApiError);
        expect(result.current.error).toMatchObject({
            code: 'NOT_FOUND',
            message: 'No registered user matches that query',
            status: 404,
        });
    });

    it('fetches each distinct query under an independent cache key', async () => {
        vi.mocked(usersApi.lookup)
            .mockResolvedValueOnce([{ id: 'user-1', name: 'Priya Sharma' }])
            .mockResolvedValueOnce([{ id: 'user-2', name: 'Jordan Lee' }]);
        const queryClient = new QueryClient();
        const { result, rerender } = renderHook(
            ({ query }: { query: string }) => useUserLookup({ query }),
            {
                initialProps: { query: 'priya' },
                wrapper: wrapperFor(queryClient),
            },
        );

        await waitFor(() => expect(result.current.data?.[0]?.id).toBe('user-1'));

        rerender({ query: 'jordan' });

        await waitFor(() => expect(result.current.data?.[0]?.id).toBe('user-2'));
        expect(usersApi.lookup).toHaveBeenNthCalledWith(1, { query: 'priya' });
        expect(usersApi.lookup).toHaveBeenNthCalledWith(2, { query: 'jordan' });
        expect(queryClient.getQueryData(['users', 'lookup', { query: 'priya' }])).toEqual([
            { id: 'user-1', name: 'Priya Sharma' },
        ]);
        expect(queryClient.getQueryData(['users', 'lookup', { query: 'jordan' }])).toEqual([
            { id: 'user-2', name: 'Jordan Lee' },
        ]);
    });

    it('enables a previously disabled lookup when a usable query is supplied', async () => {
        vi.mocked(usersApi.lookup).mockResolvedValue([]);
        const { result, rerender } = renderHook(
            ({ query }: { query: string }) => useUserLookup({ query }),
            {
                initialProps: { query: '   ' },
                wrapper: wrapperFor(new QueryClient()),
            },
        );

        expect(result.current.fetchStatus).toBe('idle');

        rerender({ query: 'priya' });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(usersApi.lookup).toHaveBeenCalledOnce();
        expect(usersApi.lookup).toHaveBeenCalledWith({ query: 'priya' });
    });
});
