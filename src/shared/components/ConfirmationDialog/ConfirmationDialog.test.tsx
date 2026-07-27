import { render, screen } from '@testing-library/react';
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

        expect(onConfirm).toHaveBeenCalled();
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
});
