import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as authApi from '@features/auth/api/authApi';
import { useChangePassword } from './useChangePassword';

vi.mock('@features/auth/api/authApi', () => ({
    changePassword: vi.fn(),
}));

function renderUseChangePassword() {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    return renderHook(() => useChangePassword(), { wrapper });
}

describe('useChangePassword', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls changePassword with the given input and resolves on success', async () => {
        vi.mocked(authApi.changePassword).mockResolvedValue(undefined);
        const { result } = renderUseChangePassword();

        result.current.mutate({ currentPassword: 'old-password', newPassword: 'new-password' });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(authApi.changePassword).toHaveBeenCalledWith({
            currentPassword: 'old-password',
            newPassword: 'new-password',
        });
    });

    it('surfaces an error when the current password is wrong', async () => {
        vi.mocked(authApi.changePassword).mockRejectedValue(
            new Error('Current password is incorrect'),
        );
        const { result } = renderUseChangePassword();

        result.current.mutate({ currentPassword: 'wrong-password', newPassword: 'new-password' });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.error?.message).toBe('Current password is incorrect');
    });
});
