import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { EditGroupMembersForm } from './EditGroupMembersForm';

const users: User[] = [
    { id: 'user-1', name: 'Priya Sharma', email: 'priya@example.com' },
    { id: 'user-2', name: 'Jordan Lee', phone: '5551234567' },
];

describe('EditGroupMembersForm', () => {
    it('pre-checks the current members', () => {
        render(
            <EditGroupMembersForm
                users={users}
                initialMemberIds={['user-1']}
                onSubmit={vi.fn()}
                onCancel={vi.fn()}
            />,
        );

        expect(screen.getByRole('checkbox', { name: /priya sharma/i })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: /jordan lee/i })).not.toBeChecked();
    });

    it('calls onSubmit with the updated member ids', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(
            <EditGroupMembersForm
                users={users}
                initialMemberIds={['user-1']}
                onSubmit={onSubmit}
                onCancel={vi.fn()}
            />,
        );

        await user.click(screen.getByRole('checkbox', { name: /jordan lee/i }));
        await user.click(screen.getByRole('checkbox', { name: /priya sharma/i }));
        await user.click(screen.getByRole('button', { name: /save changes/i }));

        expect(onSubmit).toHaveBeenCalledWith({ memberIds: ['user-2'] });
    });

    it('shows an error and does not submit when removing every member', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(
            <EditGroupMembersForm
                users={users}
                initialMemberIds={['user-1']}
                onSubmit={onSubmit}
                onCancel={vi.fn()}
            />,
        );

        await user.click(screen.getByRole('checkbox', { name: /priya sharma/i }));
        await user.click(screen.getByRole('button', { name: /save changes/i }));

        expect(await screen.findByText(/needs at least one member/i)).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('calls onCancel when the cancel button is clicked', async () => {
        const onCancel = vi.fn();
        const user = userEvent.setup();
        render(
            <EditGroupMembersForm
                users={users}
                initialMemberIds={[]}
                onSubmit={vi.fn()}
                onCancel={onCancel}
            />,
        );

        await user.click(screen.getByRole('button', { name: /cancel/i }));

        expect(onCancel).toHaveBeenCalled();
    });
});
