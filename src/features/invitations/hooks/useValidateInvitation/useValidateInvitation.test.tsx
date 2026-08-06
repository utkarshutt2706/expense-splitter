import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as invitationsApi from '@features/invitations/api/invitationsApi';
import { ApiError } from '@lib/api/apiError';
import { useValidateInvitation } from './useValidateInvitation';

vi.mock('@features/invitations/api/invitationsApi', () => ({
    validate: vi.fn(),
}));

function wrapperFor(queryClient: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
}

describe('useValidateInvitation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('validates the given token', async () => {
        const validation = {
            email: 'jamie@example.com',
            group: { id: 'group-1', name: 'Goa Trip' },
            inviterName: 'Alice',
        };
        vi.mocked(invitationsApi.validate).mockResolvedValue(validation);

        const { result } = renderHook(() => useValidateInvitation('raw-token'), {
            wrapper: wrapperFor(new QueryClient()),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(validation);
        expect(invitationsApi.validate).toHaveBeenCalledWith('raw-token');
    });

    it('does not fetch when the token is null', () => {
        const { result } = renderHook(() => useValidateInvitation(null), {
            wrapper: wrapperFor(new QueryClient()),
        });

        expect(result.current.fetchStatus).toBe('idle');
    });

    it('does not retry a NOT_FOUND error', async () => {
        vi.mocked(invitationsApi.validate).mockRejectedValue(
            new ApiError('NOT_FOUND', 'Invitation not found', 404),
        );

        const { result } = renderHook(() => useValidateInvitation('bad-token'), {
            wrapper: wrapperFor(new QueryClient()),
        });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(invitationsApi.validate).toHaveBeenCalledTimes(1);
    });
});
