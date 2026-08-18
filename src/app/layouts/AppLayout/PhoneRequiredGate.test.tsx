import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@app/stores';
import { updateUser } from '@features/users/api/usersApi';
import { PhoneRequiredGate } from './PhoneRequiredGate';

vi.mock('@features/users/api/usersApi', () => ({
    updateUser: vi.fn(),
}));

function renderGate() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <PhoneRequiredGate currentUserId="user-1" />
        </QueryClientProvider>,
    );
}

describe('PhoneRequiredGate', () => {
    beforeEach(() => {
        localStorage.clear();
        useAuthStore.setState({
            currentUserId: 'user-1',
            cachedUser: {
                id: 'user-1',
                name: 'Alex Morgan',
                email: 'alex@example.com',
            },
            accessToken: 'token',
        });
        vi.clearAllMocks();
    });

    it('shows validation feedback when the entered phone number is invalid', async () => {
        const user = userEvent.setup();
        renderGate();

        await user.type(screen.getByLabelText('Phone'), '123');
        await user.click(screen.getByRole('button', { name: /save and continue/i }));

        expect(
            screen.getByText('Enter a valid 10-digit number starting with 6, 7, 8, or 9'),
        ).toBeInTheDocument();
        expect(updateUser).not.toHaveBeenCalled();
    });

    it('sanitizes valid input, saves the phone number, and updates the cached user', async () => {
        const user = userEvent.setup();
        vi.mocked(updateUser).mockResolvedValue({
            id: 'user-1',
            name: 'Alex Morgan',
            email: 'alex@example.com',
            phone: '9876543210',
        });
        renderGate();

        await user.type(screen.getByLabelText('Phone'), '98-7654 3210');
        await user.click(screen.getByRole('button', { name: /save and continue/i }));

        await waitFor(() =>
            expect(updateUser).toHaveBeenCalledWith('user-1', { phone: '9876543210' }),
        );
        await waitFor(() =>
            expect(useAuthStore.getState().cachedUser?.phone).toBe('9876543210'),
        );
    });

    it('shows the API error when the phone update fails', async () => {
        const user = userEvent.setup();
        vi.mocked(updateUser).mockRejectedValue(new Error('Request failed'));
        renderGate();

        await user.type(screen.getByLabelText('Phone'), '9876543210');
        await user.click(screen.getByRole('button', { name: /save and continue/i }));

        await waitFor(() => expect(screen.getByText('Request failed')).toBeInTheDocument());
    });
});
