import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UpsertGroupDialog } from './UpsertGroupDialog';

vi.mock('./UpsertGroupForm', () => ({
    UpsertGroupForm: ({
        onSubmit,
        onCancel,
    }: {
        onSubmit: (values: { name: string; memberIds: string[] }) => void;
        onCancel: () => void;
    }) => (
        <div data-testid="upsert-group-form">
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

describe('UpsertGroupDialog', () => {
    it('does not render the form when closed', () => {
        render(
            <UpsertGroupDialog
                mode="add"
                open={false}
                onOpenChange={vi.fn()}
                friends={[]}
                onSubmit={vi.fn()}
            />,
        );

        expect(screen.queryByTestId('upsert-group-form')).not.toBeInTheDocument();
    });

    it('renders the add-mode title when open', () => {
        render(
            <UpsertGroupDialog
                mode="add"
                open
                onOpenChange={vi.fn()}
                friends={[]}
                onSubmit={vi.fn()}
            />,
        );

        expect(screen.getByTestId('upsert-group-form')).toBeInTheDocument();
        expect(screen.getByText(/create a group/i)).toBeInTheDocument();
    });

    it('renders the edit-mode title when open', () => {
        render(
            <UpsertGroupDialog
                mode="edit"
                open
                onOpenChange={vi.fn()}
                friends={[]}
                onSubmit={vi.fn()}
            />,
        );

        expect(screen.getByText(/^edit group$/i)).toBeInTheDocument();
    });

    it('reports closed when the close button is clicked', async () => {
        const onOpenChange = vi.fn();
        const user = userEvent.setup();
        render(
            <UpsertGroupDialog
                mode="add"
                open
                onOpenChange={onOpenChange}
                friends={[]}
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
            <UpsertGroupDialog
                mode="add"
                open
                onOpenChange={onOpenChange}
                friends={[]}
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
            <UpsertGroupDialog
                mode="edit"
                open
                onOpenChange={onOpenChange}
                friends={[]}
                onSubmit={onSubmit}
            />,
        );

        await user.click(screen.getByRole('button', { name: /fake submit/i }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(onSubmit).toHaveBeenCalledWith({ name: 'Weekend Trip', memberIds: ['friend-1'] });
    });
});
