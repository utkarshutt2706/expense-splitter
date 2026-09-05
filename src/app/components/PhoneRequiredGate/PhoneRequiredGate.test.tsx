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

    it('cannot be dismissed before a phone number is saved', async () => {
        const user = userEvent.setup();
        renderGate();

        expect(screen.getByRole('dialog', { name: /add your phone number/i })).toBeInTheDocument();
        await user.keyboard('{Escape}');

        expect(screen.getByRole('dialog', { name: /add your phone number/i })).toBeInTheDocument();
    });

    it.each(['', '5876543210', '987654321'])(
        'rejects the invalid boundary value %j',
        async (phone) => {
            const user = userEvent.setup();
            renderGate();

            if (phone) await user.type(screen.getByLabelText('Phone'), phone);
            await user.click(screen.getByRole('button', { name: /save and continue/i }));

            expect(updateUser).not.toHaveBeenCalled();
            expect(screen.getByText(/enter a valid 10-digit number/i)).toBeInTheDocument();
        },
    );

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
        await waitFor(() => expect(useAuthStore.getState().cachedUser?.phone).toBe('9876543210'));
    });

    it('shows the API error when the phone update fails', async () => {
        const user = userEvent.setup();
        vi.mocked(updateUser).mockRejectedValue(new Error('Request failed'));
        renderGate();

        await user.type(screen.getByLabelText('Phone'), '9876543210');
        await user.click(screen.getByRole('button', { name: /save and continue/i }));

        await waitFor(() => expect(screen.getByText('Request failed')).toBeInTheDocument());
    });

    it('shows the fallback error for a non-Error rejection', async () => {
        vi.mocked(updateUser).mockRejectedValue('unstructured failure');
        const user = userEvent.setup();
        renderGate();

        await user.type(screen.getByLabelText('Phone'), '9876543210');
        await user.click(screen.getByRole('button', { name: /save and continue/i }));

        expect(await screen.findByText('Something went wrong.')).toBeInTheDocument();
    });

    it('clears validation feedback when the user edits the number', async () => {
        const user = userEvent.setup();
        renderGate();
        const input = screen.getByLabelText('Phone');

        await user.type(input, '123');
        await user.click(screen.getByRole('button', { name: /save and continue/i }));
        expect(screen.getByText(/enter a valid 10-digit number/i)).toBeInTheDocument();

        await user.type(input, '4');
        expect(screen.queryByText(/enter a valid 10-digit number/i)).not.toBeInTheDocument();
    });

    it('disables repeat submission and shows progress while saving', async () => {
        let resolveUpdate!: (value: Awaited<ReturnType<typeof updateUser>>) => void;
        vi.mocked(updateUser).mockImplementation(
            () => new Promise((resolve) => (resolveUpdate = resolve)),
        );
        const user = userEvent.setup();
        renderGate();

        await user.type(screen.getByLabelText('Phone'), '9876543210');
        await user.click(screen.getByRole('button', { name: /save and continue/i }));

        const saving = await screen.findByRole('button', { name: /saving/i });
        expect(saving).toBeDisabled();
        await user.click(saving);
        expect(updateUser).toHaveBeenCalledOnce();

        resolveUpdate({
            id: 'user-1',
            name: 'Alex Morgan',
            email: 'alex@example.com',
            phone: '9876543210',
        });
        await waitFor(() =>
            expect(screen.getByRole('button', { name: /save and continue/i })).toBeEnabled(),
        );
    });
});
