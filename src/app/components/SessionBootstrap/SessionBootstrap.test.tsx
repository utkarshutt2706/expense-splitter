import { render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@app/stores';
import type { User } from '@features/users/api/usersApi';
import { refreshSession } from '@features/auth/api/authApi';
import { SessionBootstrap } from './SessionBootstrap';

vi.mock('@features/auth/api/authApi', () => ({
    refreshSession: vi.fn(),
}));

const user: User = { id: 'user-1', name: 'Alex Morgan', email: 'alex@example.com' };

describe('SessionBootstrap', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAuthStore.setState({ currentUserId: null, cachedUser: null, accessToken: null });
    });

    it('restores the in-memory session before rendering the application', async () => {
        vi.mocked(refreshSession).mockResolvedValue({ user, accessToken: 'refreshed-token' });

        render(
            <SessionBootstrap>
                <p>application</p>
            </SessionBootstrap>,
        );

        expect(screen.queryByText('application')).not.toBeInTheDocument();
        expect(await screen.findByText('application')).toBeInTheDocument();
        expect(useAuthStore.getState()).toMatchObject({
            currentUserId: user.id,
            cachedUser: user,
            accessToken: 'refreshed-token',
        });
    });

    it('renders for anonymous users when no refresh session exists', async () => {
        vi.mocked(refreshSession).mockResolvedValue(null);

        render(
            <SessionBootstrap>
                <p>application</p>
            </SessionBootstrap>,
        );

        await waitFor(() => expect(screen.getByText('application')).toBeInTheDocument());
        expect(useAuthStore.getState().accessToken).toBeNull();
    });

    it('continues as anonymous when session restoration fails', async () => {
        vi.mocked(refreshSession).mockRejectedValue(new Error('network unavailable'));

        render(
            <SessionBootstrap>
                <p>application</p>
            </SessionBootstrap>,
        );

        await waitFor(() => expect(screen.getByText('application')).toBeInTheDocument());
    });

    it('refreshes only once when effects are replayed in StrictMode', async () => {
        vi.mocked(refreshSession).mockResolvedValue(null);

        render(
            <StrictMode>
                <SessionBootstrap>
                    <p>application</p>
                </SessionBootstrap>
            </StrictMode>,
        );

        expect(await screen.findByText('application')).toBeInTheDocument();
        expect(refreshSession).toHaveBeenCalledOnce();
    });
});
