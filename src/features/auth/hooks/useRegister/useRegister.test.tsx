import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@app/stores';
import * as authApi from '@features/auth/api/authApi';
import { useRegister } from './useRegister';

vi.mock('@features/auth/api/authApi', () => ({
    register: vi.fn(),
}));

function renderUseRegister() {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    return renderHook(() => useRegister(), { wrapper });
}

describe('useRegister', () => {
    beforeEach(() => {
        localStorage.clear();
        useAuthStore.setState({ currentUserId: null, cachedUser: null, accessToken: null });
        vi.clearAllMocks();
    });

    it('commits the returned session to authStore on success', async () => {
        const user = { id: 'new-user', name: 'New Friend', email: 'new.friend@example.com' };
        vi.mocked(authApi.register).mockResolvedValue({ user, accessToken: 'test-token' });
        const { result } = renderUseRegister();

        result.current.mutate({
            name: 'New Friend',
            email: 'new.friend@example.com',
            password: 'password123',
            phone: '9876543210',
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(useAuthStore.getState().currentUserId).toBe(user.id);
        expect(useAuthStore.getState().cachedUser).toEqual(user);
        expect(useAuthStore.getState().accessToken).toBe('test-token');
    });

    it('leaves the session untouched when registration fails', async () => {
        vi.mocked(authApi.register).mockRejectedValue(
            new Error('A user with this email already exists'),
        );
        const { result } = renderUseRegister();

        result.current.mutate({
            name: 'New Friend',
            email: 'taken@example.com',
            password: 'password123',
            phone: '9876543211',
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(useAuthStore.getState().currentUserId).toBeNull();
    });
});
