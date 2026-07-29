import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { SplitParticipantList } from './SplitParticipantList';

const users: User[] = [
    { id: 'user-2', name: 'Priya Sharma', email: 'priya@example.com' },
    { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
];

describe('SplitParticipantList', () => {
    it('lists the current user first, labeled "You"', () => {
        render(
            <SplitParticipantList
                users={users}
                splitType="equal"
                selectedIds={users.map((user) => user.id)}
                onToggle={vi.fn()}
                values={{}}
                onValueChange={vi.fn()}
            />,
        );

        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes[0]).toHaveAccessibleName('You');
        expect(checkboxes[1]).toHaveAccessibleName(/priya sharma/i);
    });

    it('renders no trailing input for the equal split type', () => {
        render(
            <SplitParticipantList
                users={users}
                splitType="equal"
                selectedIds={users.map((user) => user.id)}
                onToggle={vi.fn()}
                values={{}}
                onValueChange={vi.fn()}
            />,
        );

        expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    });

    it('renders an amount input per selected participant for the exact split type', () => {
        render(
            <SplitParticipantList
                users={users}
                splitType="exact"
                selectedIds={users.map((user) => user.id)}
                onToggle={vi.fn()}
                values={{}}
                onValueChange={vi.fn()}
            />,
        );

        expect(screen.getByRole('spinbutton', { name: 'You amount' })).toBeInTheDocument();
        expect(
            screen.getByRole('spinbutton', { name: /priya sharma amount/i }),
        ).toBeInTheDocument();
    });

    it('renders a percentage input per selected participant for the percentage split type', () => {
        render(
            <SplitParticipantList
                users={users}
                splitType="percentage"
                selectedIds={[CURRENT_USER_ID]}
                onToggle={vi.fn()}
                values={{}}
                onValueChange={vi.fn()}
            />,
        );

        expect(screen.getByRole('spinbutton', { name: 'You percentage' })).toBeInTheDocument();
        expect(screen.queryByRole('spinbutton', { name: /priya sharma/i })).not.toBeInTheDocument();
    });

    it('renders a shares input per selected participant for the shares split type', () => {
        render(
            <SplitParticipantList
                users={users}
                splitType="shares"
                selectedIds={users.map((user) => user.id)}
                onToggle={vi.fn()}
                values={{}}
                onValueChange={vi.fn()}
            />,
        );

        expect(screen.getByRole('spinbutton', { name: 'You shares' })).toBeInTheDocument();
        expect(
            screen.getByRole('spinbutton', { name: /priya sharma shares/i }),
        ).toBeInTheDocument();
    });

    it('does not render a trailing input for an unselected participant', () => {
        render(
            <SplitParticipantList
                users={users}
                splitType="exact"
                selectedIds={[CURRENT_USER_ID]}
                onToggle={vi.fn()}
                values={{}}
                onValueChange={vi.fn()}
            />,
        );

        expect(screen.getByRole('spinbutton', { name: 'You amount' })).toBeInTheDocument();
        expect(screen.queryByRole('spinbutton', { name: /priya sharma/i })).not.toBeInTheDocument();
    });

    it('calls onValueChange when a trailing input changes', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(
            <SplitParticipantList
                users={users}
                splitType="percentage"
                selectedIds={[CURRENT_USER_ID]}
                onToggle={vi.fn()}
                values={{}}
                onValueChange={onValueChange}
            />,
        );

        await user.type(screen.getByRole('spinbutton', { name: 'You percentage' }), '5');

        expect(onValueChange).toHaveBeenCalledWith(CURRENT_USER_ID, '5');
    });

    it('calls onToggle when a participant checkbox is clicked', async () => {
        const onToggle = vi.fn();
        const user = userEvent.setup();
        render(
            <SplitParticipantList
                users={users}
                splitType="equal"
                selectedIds={[]}
                onToggle={onToggle}
                values={{}}
                onValueChange={vi.fn()}
            />,
        );

        await user.click(screen.getByRole('checkbox', { name: 'You' }));

        expect(onToggle).toHaveBeenCalledWith(CURRENT_USER_ID);
    });

    it('shows the empty message when there are no users', () => {
        render(
            <SplitParticipantList
                users={[]}
                splitType="equal"
                selectedIds={[]}
                onToggle={vi.fn()}
                values={{}}
                onValueChange={vi.fn()}
                emptyMessage="No members yet."
            />,
        );

        expect(screen.getByText('No members yet.')).toBeInTheDocument();
    });
});
