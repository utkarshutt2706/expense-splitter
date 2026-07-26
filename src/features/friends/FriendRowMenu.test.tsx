import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FriendRowMenu } from './FriendRowMenu';

describe('FriendRowMenu', () => {
    it('opens the menu when the trigger is clicked', async () => {
        const user = userEvent.setup();
        render(<FriendRowMenu friendName="Priya Sharma" onEdit={vi.fn()} onRemove={vi.fn()} />);

        expect(screen.queryByText(/edit/i)).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /open actions for priya sharma/i }));

        expect(screen.getByText(/edit/i)).toBeInTheDocument();
        expect(screen.getByText(/remove/i)).toBeInTheDocument();
    });

    it('calls onEdit when Edit is selected', async () => {
        const onEdit = vi.fn();
        const user = userEvent.setup();
        render(<FriendRowMenu friendName="Priya Sharma" onEdit={onEdit} onRemove={vi.fn()} />);

        await user.click(screen.getByRole('button', { name: /open actions for priya sharma/i }));
        await user.click(screen.getByText(/edit/i));

        expect(onEdit).toHaveBeenCalled();
    });

    it('calls onRemove when Remove is selected', async () => {
        const onRemove = vi.fn();
        const user = userEvent.setup();
        render(<FriendRowMenu friendName="Priya Sharma" onEdit={vi.fn()} onRemove={onRemove} />);

        await user.click(screen.getByRole('button', { name: /open actions for priya sharma/i }));
        await user.click(screen.getByText(/remove/i));

        expect(onRemove).toHaveBeenCalled();
    });
});
