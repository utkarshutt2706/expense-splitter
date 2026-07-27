import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EditGroupMembersDialog } from './EditGroupMembersDialog';

vi.mock('../EditGroupMembersForm', () => ({
    EditGroupMembersForm: ({
        onSubmit,
        onCancel,
    }: {
        onSubmit: (values: { memberIds: string[] }) => void;
        onCancel: () => void;
    }) => (
        <div data-testid="edit-group-members-form">
            <button type="button" onClick={() => onSubmit({ memberIds: ['user-1'] })}>
                Fake submit
            </button>
            <button type="button" onClick={onCancel}>
                Fake cancel
            </button>
        </div>
    ),
}));

describe('EditGroupMembersDialog', () => {
    it('does not render the form when closed', () => {
        render(
            <EditGroupMembersDialog
                open={false}
                onOpenChange={vi.fn()}
                users={[]}
                initialMemberIds={[]}
                onSubmit={vi.fn()}
            />,
        );

        expect(screen.queryByTestId('edit-group-members-form')).not.toBeInTheDocument();
    });

    it('renders the form when open', () => {
        render(
            <EditGroupMembersDialog
                open
                onOpenChange={vi.fn()}
                users={[]}
                initialMemberIds={[]}
                onSubmit={vi.fn()}
            />,
        );

        expect(screen.getByTestId('edit-group-members-form')).toBeInTheDocument();
        expect(screen.getByText(/edit members/i)).toBeInTheDocument();
    });

    it('reports closed when the close button is clicked', async () => {
        const onOpenChange = vi.fn();
        const user = userEvent.setup();
        render(
            <EditGroupMembersDialog
                open
                onOpenChange={onOpenChange}
                users={[]}
                initialMemberIds={[]}
                onSubmit={vi.fn()}
            />,
        );

        await user.click(screen.getByRole('button', { name: /close/i }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('reports closed when the form reports cancel', async () => {
        const onOpenChange = vi.fn();
        const user = userEvent.setup();
        render(
            <EditGroupMembersDialog
                open
                onOpenChange={onOpenChange}
                users={[]}
                initialMemberIds={[]}
                onSubmit={vi.fn()}
            />,
        );

        await user.click(screen.getByRole('button', { name: /fake cancel/i }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('reports closed and forwards the values when the form submits', async () => {
        const onOpenChange = vi.fn();
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(
            <EditGroupMembersDialog
                open
                onOpenChange={onOpenChange}
                users={[]}
                initialMemberIds={[]}
                onSubmit={onSubmit}
            />,
        );

        await user.click(screen.getByRole('button', { name: /fake submit/i }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(onSubmit).toHaveBeenCalledWith({ memberIds: ['user-1'] });
    });
});
