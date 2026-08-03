import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@app/stores';
import * as authApi from '@features/auth/api/authApi';
import { useLogin } from './useLogin';

vi.mock('@features/auth/api/authApi', () => ({
    login: vi.fn(),
}));

function renderUseLogin() {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    return renderHook(() => useLogin(), { wrapper });
}

describe('useLogin', () => {
    beforeEach(() => {
        localStorage.clear();
        useAuthStore.setState({ currentUserId: null, cachedUser: null, accessToken: null });
        vi.clearAllMocks();
    });

    it('commits the returned session to authStore on success', async () => {
        const user = {
            id: 'current-user',
            name: 'Utkarsh Srivastava',
            email: 'utkarsh@example.com',
        };
        vi.mocked(authApi.login).mockResolvedValue({ user, accessToken: 'test-token' });
        const { result } = renderUseLogin();

        result.current.mutate({ email: 'utkarsh@example.com', password: 'password123' });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(useAuthStore.getState().currentUserId).toBe(user.id);
        expect(useAuthStore.getState().cachedUser).toEqual(user);
        expect(useAuthStore.getState().accessToken).toBe('test-token');
    });

    it('leaves the session untouched when login fails', async () => {
        vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid email or password'));
        const { result } = renderUseLogin();

        result.current.mutate({ email: 'utkarsh@example.com', password: 'wrong-password' });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(useAuthStore.getState().currentUserId).toBeNull();
    });
});
