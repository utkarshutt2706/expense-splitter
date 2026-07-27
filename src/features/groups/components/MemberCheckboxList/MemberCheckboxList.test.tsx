import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
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
});
