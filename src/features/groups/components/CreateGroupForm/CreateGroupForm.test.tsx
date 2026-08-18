import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { useUserLookup } from '@features/users/hooks';
import { CreateGroupForm } from './CreateGroupForm';

vi.mock('@features/users/hooks', () => ({
    useUserLookup: vi.fn(),
}));

function mockLookup(overrides: Record<string, unknown> = {}) {
    vi.mocked(useUserLookup).mockReturnValue({
        data: undefined,
        isFetching: false,
        isError: false,
        error: null,
        ...overrides,
    } as unknown as ReturnType<typeof useUserLookup>);
}

const friends: User[] = [
    { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' },
    { id: 'friend-2', name: 'Jordan Lee', phone: '5551234567' },
];

describe('CreateGroupForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLookup();
    });

    it('shows a validation error when submitted without a name', async () => {
        const onSubmit = vi.fn();

        const user = userEvent.setup();
        render(<CreateGroupForm friends={friends} onSubmit={onSubmit} onCancel={vi.fn()} />);

        await user.click(screen.getByRole('button', { name: /create group/i }));

        expect(await screen.findByText(/group name is required/i)).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('calls onSubmit with the name and no members when none are selected', async () => {
        const onSubmit = vi.fn();

        const user = userEvent.setup();
        render(<CreateGroupForm friends={friends} onSubmit={onSubmit} onCancel={vi.fn()} />);

        await user.type(screen.getByLabelText(/group name/i), 'Weekend Trip');
        await user.click(screen.getByRole('button', { name: /create group/i }));

        expect(onSubmit).toHaveBeenCalledWith({ name: 'Weekend Trip', memberIds: [] });
    });

    it('calls onSubmit with the selected member ids', async () => {
        const onSubmit = vi.fn();

        const user = userEvent.setup();
        render(<CreateGroupForm friends={friends} onSubmit={onSubmit} onCancel={vi.fn()} />);

        await user.type(screen.getByLabelText(/group name/i), 'Weekend Trip');
        await user.click(screen.getByRole('checkbox', { name: /priya sharma/i }));
        await user.click(screen.getByRole('button', { name: /create group/i }));

        expect(onSubmit).toHaveBeenCalledWith({
            name: 'Weekend Trip',
            memberIds: ['friend-1'],
        });
    });

    it('unchecks a member when clicked twice', async () => {
        const onSubmit = vi.fn();

        const user = userEvent.setup();
        render(<CreateGroupForm friends={friends} onSubmit={onSubmit} onCancel={vi.fn()} />);

        await user.type(screen.getByLabelText(/group name/i), 'Weekend Trip');
        const checkbox = screen.getByRole('checkbox', { name: /priya sharma/i });
        await user.click(checkbox);
        await user.click(checkbox);
        await user.click(screen.getByRole('button', { name: /create group/i }));

        expect(onSubmit).toHaveBeenCalledWith({ name: 'Weekend Trip', memberIds: [] });
    });

    it('shows a message instead of the member list when there are no friends', () => {
        render(<CreateGroupForm friends={[]} onSubmit={vi.fn()} onCancel={vi.fn()} />);

        expect(screen.getByText(/don't have any friends yet/i)).toBeInTheDocument();
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('calls onCancel when the cancel button is clicked', async () => {
        const onCancel = vi.fn();

        const user = userEvent.setup();
        render(<CreateGroupForm friends={friends} onSubmit={vi.fn()} onCancel={onCancel} />);

        await user.click(screen.getByRole('button', { name: /cancel/i }));

        expect(onCancel).toHaveBeenCalled();
    });

    it('adds a non-friend found by search and submits them as a member', async () => {
        const jamie: User = { id: 'user-9', name: 'Jamie Fox', email: 'jamie@example.com' };
        mockLookup({ data: [jamie] });
        vi.useFakeTimers();

        const onSubmit = vi.fn();
        render(<CreateGroupForm friends={friends} onSubmit={onSubmit} onCancel={vi.fn()} />);

        fireEvent.change(screen.getByRole('searchbox', { name: /search members/i }), {
            target: { value: 'jamie@example.com' },
        });
        act(() => {
            vi.advanceTimersByTime(400);
        });

        expect(screen.getByText(/jamie fox/i)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /add/i }));
        fireEvent.change(screen.getByLabelText(/group name/i), {
            target: { value: 'Weekend Trip' },
        });
        fireEvent.click(screen.getByRole('button', { name: /create group/i }));

        vi.useRealTimers();
        await vi.waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith({
                name: 'Weekend Trip',
                memberIds: ['user-9'],
            }),
        );
    });
});
