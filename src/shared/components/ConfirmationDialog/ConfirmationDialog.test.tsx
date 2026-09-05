import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmationDialog } from './ConfirmationDialog';

const baseProps = {
    title: 'Remove Priya Sharma?',
    description: 'This removes them from your friends list.',
    confirmLabel: 'Remove',
};

describe('ConfirmationDialog', () => {
    it('renders the title and description when open', () => {
        render(
            <ConfirmationDialog open onOpenChange={vi.fn()} onConfirm={vi.fn()} {...baseProps} />,
        );

        expect(screen.getByText('Remove Priya Sharma?')).toBeInTheDocument();
        expect(screen.getByText('This removes them from your friends list.')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(
            <ConfirmationDialog
                open={false}
                onOpenChange={vi.fn()}
                onConfirm={vi.fn()}
                {...baseProps}
            />,
        );

        expect(screen.queryByText('Remove Priya Sharma?')).not.toBeInTheDocument();
    });

    it('renders the confirm label as the confirm button text', () => {
        render(
            <ConfirmationDialog open onOpenChange={vi.fn()} onConfirm={vi.fn()} {...baseProps} />,
        );

        expect(screen.getByRole('button', { name: /^remove$/i })).toBeInTheDocument();
    });

    it('calls onConfirm when the confirm button is clicked', async () => {
        const onConfirm = vi.fn();
        const user = userEvent.setup();
        render(
            <ConfirmationDialog open onOpenChange={vi.fn()} onConfirm={onConfirm} {...baseProps} />,
        );

        await user.click(screen.getByRole('button', { name: /^remove$/i }));

        expect(onConfirm).toHaveBeenCalledOnce();
    });

    it('reports closed when cancel is clicked', async () => {
        const onOpenChange = vi.fn();
        const user = userEvent.setup();
        render(
            <ConfirmationDialog
                open
                onOpenChange={onOpenChange}
                onConfirm={vi.fn()}
                {...baseProps}
            />,
        );

        await user.click(screen.getByRole('button', { name: /cancel/i }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('focuses Cancel initially', () => {
        render(
            <ConfirmationDialog open onOpenChange={vi.fn()} onConfirm={vi.fn()} {...baseProps} />,
        );

        expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    });

    it('disables both actions while pending', () => {
        render(
            <ConfirmationDialog
                open
                onOpenChange={vi.fn()}
                onConfirm={vi.fn()}
                isPending
                pendingLabel="Deleting…"
                {...baseProps}
            />,
        );

        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Deleting…' })).toHaveAttribute(
            'aria-busy',
            'true',
        );
    });

    it('uses the default pending label when none is supplied', () => {
        render(
            <ConfirmationDialog
                open
                onOpenChange={vi.fn()}
                onConfirm={vi.fn()}
                isPending
                {...baseProps}
            />,
        );

        expect(screen.getByRole('button', { name: 'Working…' })).toBeDisabled();
    });

    it('prevents Escape from closing while pending', () => {
        const onOpenChange = vi.fn();
        render(
            <ConfirmationDialog
                open
                onOpenChange={onOpenChange}
                onConfirm={vi.fn()}
                isPending
                {...baseProps}
            />,
        );

        fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' });

        expect(onOpenChange).not.toHaveBeenCalled();
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('allows Escape to request closure when idle', async () => {
        const onOpenChange = vi.fn();
        const user = userEvent.setup();
        render(
            <ConfirmationDialog
                open
                onOpenChange={onOpenChange}
                onConfirm={vi.fn()}
                {...baseProps}
            />,
        );

        await user.keyboard('{Escape}');

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('does not confirm again while pending', async () => {
        const onConfirm = vi.fn();
        const user = userEvent.setup();
        render(
            <ConfirmationDialog
                open
                onOpenChange={vi.fn()}
                onConfirm={onConfirm}
                isPending
                {...baseProps}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Working…' }));

        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('applies destructive styling only when requested', () => {
        const { rerender } = render(
            <ConfirmationDialog open onOpenChange={vi.fn()} onConfirm={vi.fn()} {...baseProps} />,
        );
        expect(screen.getByRole('button', { name: 'Remove' })).toHaveClass('bg-brand-600');

        rerender(
            <ConfirmationDialog
                open
                onOpenChange={vi.fn()}
                onConfirm={vi.fn()}
                destructive
                {...baseProps}
            />,
        );

        expect(screen.getByRole('button', { name: 'Remove' })).toHaveClass('bg-red-600');
    });

    it('shows a safe inline error message', () => {
        render(
            <ConfirmationDialog
                open
                onOpenChange={vi.fn()}
                onConfirm={vi.fn()}
                errorMessage="Nothing was changed. Try again."
                {...baseProps}
            />,
        );

        expect(screen.getByRole('alert')).toHaveTextContent('Nothing was changed. Try again.');
    });

    it('omits the alert when there is no error', () => {
        render(
            <ConfirmationDialog open onOpenChange={vi.fn()} onConfirm={vi.fn()} {...baseProps} />,
        );

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
});
