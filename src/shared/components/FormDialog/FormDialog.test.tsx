import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FormDialog } from './FormDialog';

describe('FormDialog', () => {
    it('does not render its content when closed', () => {
        render(
            <FormDialog open={false} onOpenChange={vi.fn()} title="Add a friend" description="">
                <p>Form content</p>
            </FormDialog>,
        );

        expect(screen.queryByText('Form content')).not.toBeInTheDocument();
    });

    it('renders the title and children when open', () => {
        render(
            <FormDialog open onOpenChange={vi.fn()} title="Add a friend" description="">
                <p>Form content</p>
            </FormDialog>,
        );

        expect(screen.getByText('Add a friend')).toBeInTheDocument();
        expect(screen.getByText('Form content')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /close/i })).toHaveClass(
            'items-center',
            'justify-center',
        );
    });

    it('reports closed when the close button is clicked', async () => {
        const onOpenChange = vi.fn();
        const user = userEvent.setup();
        render(
            <FormDialog open onOpenChange={onOpenChange} title="Add a friend" description="">
                <p>Form content</p>
            </FormDialog>,
        );

        await user.click(screen.getByRole('button', { name: /close/i }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('shows or visually hides the accessible description as requested', () => {
        const { rerender } = render(
            <FormDialog
                open
                onOpenChange={vi.fn()}
                title="Add a friend"
                description="Friend details"
            >
                content
            </FormDialog>,
        );
        expect(screen.getByText('Friend details')).toHaveClass('sr-only');

        rerender(
            <FormDialog
                open
                showDescription
                onOpenChange={vi.fn()}
                title="Add a friend"
                description="Friend details"
            >
                content
            </FormDialog>,
        );
        expect(screen.getByText('Friend details')).toHaveClass('text-muted-foreground');
        expect(screen.getByRole('dialog')).toHaveAccessibleDescription('Friend details');
    });

    it('disables closing and prevents Escape while pending', () => {
        const onOpenChange = vi.fn();
        render(
            <FormDialog
                open
                isPending
                onOpenChange={onOpenChange}
                title="Add a friend"
                description="Friend details"
            >
                content
            </FormDialog>,
        );

        expect(screen.getByRole('button', { name: /close/i })).toBeDisabled();
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
        expect(onOpenChange).not.toHaveBeenCalled();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('allows Escape to request closure when idle', async () => {
        const onOpenChange = vi.fn();
        const user = userEvent.setup();
        render(
            <FormDialog open onOpenChange={onOpenChange} title="Add a friend" description="">
                content
            </FormDialog>,
        );

        await user.keyboard('{Escape}');

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });
});
