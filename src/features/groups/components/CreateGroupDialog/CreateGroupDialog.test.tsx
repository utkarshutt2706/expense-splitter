import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CreateGroupDialog } from './CreateGroupDialog';

vi.mock('./CreateGroupForm', () => ({
    CreateGroupForm: ({
        onSubmit,
        onCancel,
    }: {
        onSubmit: (values: { name: string; memberIds: string[] }) => void;
        onCancel: () => void;
    }) => (
        <div data-testid="create-group-form">
            <button
                type="button"
                onClick={() => onSubmit({ name: 'Weekend Trip', memberIds: ['friend-1'] })}
            >
                Fake submit
            </button>
            <button type="button" onClick={onCancel}>
                Fake cancel
            </button>
        </div>
    ),
}));

describe('CreateGroupDialog', () => {
    it('does not render the form when closed', () => {
        render(
            <CreateGroupDialog
                open={false}
                onOpenChange={vi.fn()}
                friends={[]}
                onSubmit={vi.fn()}
            />,
        );

        expect(screen.queryByTestId('create-group-form')).not.toBeInTheDocument();
    });

    it('renders the form when open', () => {
        render(<CreateGroupDialog open onOpenChange={vi.fn()} friends={[]} onSubmit={vi.fn()} />);

        expect(screen.getByTestId('create-group-form')).toBeInTheDocument();
        expect(screen.getByText(/create a group/i)).toBeInTheDocument();
    });

    it('reports closed when the close button is clicked', async () => {
        const onOpenChange = vi.fn();
        const user = userEvent.setup();
        render(
            <CreateGroupDialog open onOpenChange={onOpenChange} friends={[]} onSubmit={vi.fn()} />,
        );

        await user.click(screen.getByRole('button', { name: /close/i }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('reports closed when the form reports cancel', async () => {
        const onOpenChange = vi.fn();
        const user = userEvent.setup();
        render(
            <CreateGroupDialog open onOpenChange={onOpenChange} friends={[]} onSubmit={vi.fn()} />,
        );

        await user.click(screen.getByRole('button', { name: /fake cancel/i }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('reports closed and forwards the values when the form submits', async () => {
        const onOpenChange = vi.fn();
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(
            <CreateGroupDialog open onOpenChange={onOpenChange} friends={[]} onSubmit={onSubmit} />,
        );

        await user.click(screen.getByRole('button', { name: /fake submit/i }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(onSubmit).toHaveBeenCalledWith({ name: 'Weekend Trip', memberIds: ['friend-1'] });
    });
});
