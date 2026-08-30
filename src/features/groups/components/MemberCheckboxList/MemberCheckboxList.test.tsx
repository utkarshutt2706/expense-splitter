import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@features/users/api/usersApi';
import { MemberCheckboxList } from './MemberCheckboxList';

const users: User[] = [
    { id: 'user-1', name: 'Priya Sharma', email: 'priya@example.com' },
    { id: 'user-2', name: 'Jordan Lee', phone: '5551234567' },
];

describe('MemberCheckboxList', () => {
    it('shows a default message instead of the list when there are no users', () => {
        render(<MemberCheckboxList users={[]} selectedIds={[]} onToggle={vi.fn()} />);

        expect(screen.getByText(/don't have any friends yet/i)).toBeInTheDocument();
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('shows a custom empty message when provided', () => {
        render(
            <MemberCheckboxList
                users={[]}
                selectedIds={[]}
                onToggle={vi.fn()}
                emptyMessage="No members to show."
            />,
        );

        expect(screen.getByText('No members to show.')).toBeInTheDocument();
    });

    it('reflects which users are selected', () => {
        render(<MemberCheckboxList users={users} selectedIds={['user-1']} onToggle={vi.fn()} />);

        expect(screen.getByRole('checkbox', { name: /priya sharma/i })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: /jordan lee/i })).not.toBeChecked();
    });

    it('calls onToggle with the user id when a checkbox is clicked', async () => {
        const onToggle = vi.fn();
        const user = userEvent.setup();
        render(<MemberCheckboxList users={users} selectedIds={[]} onToggle={onToggle} />);

        await user.click(screen.getByRole('checkbox', { name: /priya sharma/i }));

        expect(onToggle).toHaveBeenCalledWith('user-1');
    });

    describe('current user row', () => {
        it('labels the current user as "You" without affecting their checked/disabled state by default', () => {
            render(
                <MemberCheckboxList
                    users={users}
                    selectedIds={[]}
                    onToggle={vi.fn()}
                    currentUserId="user-1"
                />,
            );

            expect(screen.queryByText('Priya Sharma')).not.toBeInTheDocument();
            const currentUserCheckbox = screen.getByRole('checkbox', { name: 'You' });
            expect(currentUserCheckbox).not.toBeChecked();
            expect(currentUserCheckbox).not.toBeDisabled();
        });

        it('still calls onToggle for the current user row when not locked', async () => {
            const onToggle = vi.fn();
            const user = userEvent.setup();
            render(
                <MemberCheckboxList
                    users={users}
                    selectedIds={[]}
                    onToggle={onToggle}
                    currentUserId="user-1"
                />,
            );

            await user.click(screen.getByRole('checkbox', { name: 'You' }));

            expect(onToggle).toHaveBeenCalledWith('user-1');
        });

        it('shows the current user checkbox as checked and disabled when locked', () => {
            render(
                <MemberCheckboxList
                    users={users}
                    selectedIds={[]}
                    onToggle={vi.fn()}
                    currentUserId="user-1"
                    lockCurrentUser
                />,
            );

            const currentUserCheckbox = screen.getByRole('checkbox', { name: 'You' });
            expect(currentUserCheckbox).toBeChecked();
            expect(currentUserCheckbox).toBeDisabled();
            expect(screen.getByRole('checkbox', { name: /jordan lee/i })).not.toBeDisabled();
        });

        it('does not call onToggle when the locked current user checkbox is clicked', async () => {
            const onToggle = vi.fn();
            const user = userEvent.setup();
            render(
                <MemberCheckboxList
                    users={users}
                    selectedIds={[]}
                    onToggle={onToggle}
                    currentUserId="user-1"
                    lockCurrentUser
                />,
            );

            await user.click(screen.getByRole('checkbox', { name: 'You' }));

            expect(onToggle).not.toHaveBeenCalled();
        });

        it('always renders the current user first, regardless of input order', () => {
            render(
                <MemberCheckboxList
                    users={users}
                    selectedIds={[]}
                    onToggle={vi.fn()}
                    currentUserId="user-2"
                />,
            );

            const rows = screen.getAllByRole('checkbox');
            expect(rows[0]).toHaveAccessibleName('You');
            expect(rows[1]).toHaveAccessibleName(/priya sharma/i);
        });
    });

    describe('ordering', () => {
        const roster: User[] = [
            { id: 'user-4', name: 'Zoe Tan' },
            { id: 'user-1', name: 'Priya Sharma' },
            { id: 'user-3', name: 'Arun Nair' },
            { id: 'user-2', name: 'Jordan Lee' },
        ];

        // The avatar span is aria-hidden and renders initials, so read the
        // visible name span rather than the whole label's text.
        const labels = () =>
            screen
                .getAllByRole('listitem')
                .map(
                    (item) =>
                        item.querySelector('label > span:not([aria-hidden])')?.textContent ?? '',
                );

        it('lists members alphabetically', () => {
            render(<MemberCheckboxList users={roster} selectedIds={[]} onToggle={vi.fn()} />);

            expect(labels()).toEqual(['Arun', 'Jordan', 'Priya', 'Zoe']);
        });

        it('pins the current user above the alphabetical remainder', () => {
            render(
                <MemberCheckboxList
                    users={roster}
                    selectedIds={[]}
                    onToggle={vi.fn()}
                    currentUserId="user-4"
                />,
            );

            expect(labels()).toEqual(['You', 'Arun', 'Jordan', 'Priya']);
        });

        it('floats priority ids above the other candidates, each band alphabetical', () => {
            render(
                <MemberCheckboxList
                    users={roster}
                    selectedIds={[]}
                    onToggle={vi.fn()}
                    priorityIds={['user-4', 'user-2']}
                />,
            );

            expect(labels()).toEqual(['Jordan', 'Zoe', 'Arun', 'Priya']);
        });

        it('keeps the current user above the priority band', () => {
            render(
                <MemberCheckboxList
                    users={roster}
                    selectedIds={[]}
                    onToggle={vi.fn()}
                    currentUserId="user-1"
                    priorityIds={['user-4', 'user-1']}
                />,
            );

            expect(labels()).toEqual(['You', 'Zoe', 'Arun', 'Jordan']);
        });

        it('does not reorder while the selection changes, so rows stay put as they are ticked', async () => {
            const user = userEvent.setup();
            const { rerender } = render(
                <MemberCheckboxList
                    users={roster}
                    selectedIds={[]}
                    onToggle={vi.fn()}
                    priorityIds={['user-4']}
                />,
            );

            const before = labels();
            await user.click(screen.getByRole('checkbox', { name: /arun nair/i }));
            rerender(
                <MemberCheckboxList
                    users={roster}
                    selectedIds={['user-3']}
                    onToggle={vi.fn()}
                    priorityIds={['user-4']}
                />,
            );

            expect(labels()).toEqual(before);
        });
    });
});
