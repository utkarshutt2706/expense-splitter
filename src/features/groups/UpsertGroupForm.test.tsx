import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { User } from '../../lib/storage/models';
import { UpsertGroupForm } from './UpsertGroupForm';

const friends: User[] = [
    { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' },
    { id: 'friend-2', name: 'Jordan Lee', phone: '5551234567' },
];

describe('UpsertGroupForm', () => {
    describe('add mode', () => {
        it('shows a validation error when submitted without a name', async () => {
            const onSubmit = vi.fn();

            const user = userEvent.setup();
            render(
                <UpsertGroupForm
                    mode="add"
                    friends={friends}
                    onSubmit={onSubmit}
                    onCancel={vi.fn()}
                />,
            );

            await user.click(screen.getByRole('button', { name: /create group/i }));

            expect(await screen.findByText(/group name is required/i)).toBeInTheDocument();
            expect(onSubmit).not.toHaveBeenCalled();
        });

        it('calls onSubmit with the name and no members when none are selected', async () => {
            const onSubmit = vi.fn();

            const user = userEvent.setup();
            render(
                <UpsertGroupForm
                    mode="add"
                    friends={friends}
                    onSubmit={onSubmit}
                    onCancel={vi.fn()}
                />,
            );

            await user.type(screen.getByLabelText(/group name/i), 'Weekend Trip');
            await user.click(screen.getByRole('button', { name: /create group/i }));

            expect(onSubmit).toHaveBeenCalledWith({ name: 'Weekend Trip', memberIds: [] });
        });

        it('calls onSubmit with the selected member ids', async () => {
            const onSubmit = vi.fn();

            const user = userEvent.setup();
            render(
                <UpsertGroupForm
                    mode="add"
                    friends={friends}
                    onSubmit={onSubmit}
                    onCancel={vi.fn()}
                />,
            );

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
            render(
                <UpsertGroupForm
                    mode="add"
                    friends={friends}
                    onSubmit={onSubmit}
                    onCancel={vi.fn()}
                />,
            );

            await user.type(screen.getByLabelText(/group name/i), 'Weekend Trip');
            const checkbox = screen.getByRole('checkbox', { name: /priya sharma/i });
            await user.click(checkbox);
            await user.click(checkbox);
            await user.click(screen.getByRole('button', { name: /create group/i }));

            expect(onSubmit).toHaveBeenCalledWith({ name: 'Weekend Trip', memberIds: [] });
        });

        it('shows a message instead of the member list when there are no friends', () => {
            render(
                <UpsertGroupForm mode="add" friends={[]} onSubmit={vi.fn()} onCancel={vi.fn()} />,
            );

            expect(screen.getByText(/don't have any friends yet/i)).toBeInTheDocument();
            expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
        });

        it('calls onCancel when the cancel button is clicked', async () => {
            const onCancel = vi.fn();

            const user = userEvent.setup();
            render(
                <UpsertGroupForm
                    mode="add"
                    friends={friends}
                    onSubmit={vi.fn()}
                    onCancel={onCancel}
                />,
            );

            await user.click(screen.getByRole('button', { name: /cancel/i }));

            expect(onCancel).toHaveBeenCalled();
        });
    });

    describe('edit mode', () => {
        it('pre-fills the name and checks the existing members', () => {
            render(
                <UpsertGroupForm
                    mode="edit"
                    friends={friends}
                    initialValues={{ name: 'Weekend Trip', memberIds: ['friend-1'] }}
                    onSubmit={vi.fn()}
                    onCancel={vi.fn()}
                />,
            );

            expect(screen.getByLabelText(/group name/i)).toHaveValue('Weekend Trip');
            expect(screen.getByRole('checkbox', { name: /priya sharma/i })).toBeChecked();
            expect(screen.getByRole('checkbox', { name: /jordan lee/i })).not.toBeChecked();
        });

        it('shows a save-changes submit button', () => {
            render(
                <UpsertGroupForm
                    mode="edit"
                    friends={friends}
                    initialValues={{ name: 'Weekend Trip', memberIds: [] }}
                    onSubmit={vi.fn()}
                    onCancel={vi.fn()}
                />,
            );

            expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
        });

        it('calls onSubmit with the edited values', async () => {
            const onSubmit = vi.fn();

            const user = userEvent.setup();
            render(
                <UpsertGroupForm
                    mode="edit"
                    friends={friends}
                    initialValues={{ name: 'Weekend Trip', memberIds: ['friend-1'] }}
                    onSubmit={onSubmit}
                    onCancel={vi.fn()}
                />,
            );

            await user.click(screen.getByRole('checkbox', { name: /jordan lee/i }));
            await user.click(screen.getByRole('button', { name: /save changes/i }));

            expect(onSubmit).toHaveBeenCalledWith({
                name: 'Weekend Trip',
                memberIds: ['friend-1', 'friend-2'],
            });
        });
    });
});
