import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { useUserLookup } from '@features/users/hooks';
import { EditGroupMembersForm } from './EditGroupMembersForm';

vi.mock('@app/hooks', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/hooks')>()),
    useCurrentUser: () => ({
        data: { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
    }),
}));

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

const users: User[] = [
    { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
    { id: 'user-1', name: 'Priya Sharma', email: 'priya@example.com' },
    { id: 'user-2', name: 'Jordan Lee', phone: '5551234567' },
];

describe('EditGroupMembersForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLookup();
    });

    it('pre-checks the current members and shows the current user as "You"', () => {
        render(
            <EditGroupMembersForm
                users={users}
                initialMemberIds={[CURRENT_USER_ID, 'user-1']}
                onSubmit={vi.fn()}
                onCancel={vi.fn()}
            />,
        );

        expect(screen.queryByText('Alex Morgan')).not.toBeInTheDocument();
        const currentUserCheckbox = screen.getByRole('checkbox', { name: 'You' });
        expect(currentUserCheckbox).toBeChecked();
        expect(currentUserCheckbox).toBeDisabled();
        expect(screen.getByRole('checkbox', { name: /priya sharma/i })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: /jordan lee/i })).not.toBeChecked();
    });

    it('calls onSubmit with the updated member ids', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(
            <EditGroupMembersForm
                users={users}
                initialMemberIds={[CURRENT_USER_ID, 'user-1']}
                onSubmit={onSubmit}
                onCancel={vi.fn()}
            />,
        );

        await user.click(screen.getByRole('checkbox', { name: /jordan lee/i }));
        await user.click(screen.getByRole('checkbox', { name: /priya sharma/i }));
        await user.click(screen.getByRole('button', { name: /save changes/i }));

        expect(onSubmit).toHaveBeenCalledWith({ memberIds: [CURRENT_USER_ID, 'user-2'] });
    });

    it('does not let the current user remove themselves', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(
            <EditGroupMembersForm
                users={users}
                initialMemberIds={[CURRENT_USER_ID]}
                onSubmit={onSubmit}
                onCancel={vi.fn()}
            />,
        );

        await user.click(screen.getByRole('checkbox', { name: 'You' }));
        await user.click(screen.getByRole('button', { name: /save changes/i }));

        expect(onSubmit).toHaveBeenCalledWith({ memberIds: [CURRENT_USER_ID] });
    });

    it('adds a non-friend found by search and submits them as a member', async () => {
        const jamie: User = { id: 'user-9', name: 'Jamie Fox', email: 'jamie@example.com' };
        mockLookup({ data: [jamie] });
        vi.useFakeTimers();

        const onSubmit = vi.fn();
        render(
            <EditGroupMembersForm
                users={users}
                initialMemberIds={[CURRENT_USER_ID]}
                onSubmit={onSubmit}
                onCancel={vi.fn()}
            />,
        );

        fireEvent.change(screen.getByRole('searchbox', { name: /search members/i }), {
            target: { value: 'jamie@example.com' },
        });
        act(() => {
            vi.advanceTimersByTime(400);
        });

        expect(screen.getByText(/^jamie$/i)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /add/i }));
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

        vi.useRealTimers();
        await vi.waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith({
                memberIds: [CURRENT_USER_ID, 'user-9'],
            }),
        );
    });

    it('calls onCancel when the cancel button is clicked', async () => {
        const onCancel = vi.fn();
        const user = userEvent.setup();
        render(
            <EditGroupMembersForm
                users={users}
                initialMemberIds={[CURRENT_USER_ID]}
                onSubmit={vi.fn()}
                onCancel={onCancel}
            />,
        );

        await user.click(screen.getByRole('button', { name: /cancel/i }));

        expect(onCancel).toHaveBeenCalled();
    });
});
