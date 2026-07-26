import { render, screen } from '@testing-library/react';
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
});
