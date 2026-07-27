import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { PaidByPicker } from './PaidByPicker';

const members: User[] = [
    { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
    { id: 'user-2', name: 'Priya Sharma', email: 'priya@example.com' },
];

describe('PaidByPicker', () => {
    it('shows "You" on the trigger when the current user is selected', () => {
        render(<PaidByPicker members={members} value={CURRENT_USER_ID} onChange={vi.fn()} />);

        expect(screen.getByRole('button', { name: 'Paid by' })).toHaveTextContent('You');
    });

    it("shows the selected member's name on the trigger", () => {
        render(<PaidByPicker members={members} value="user-2" onChange={vi.fn()} />);

        expect(screen.getByRole('button', { name: 'Paid by' })).toHaveTextContent('Priya Sharma');
    });

    it('lists every member with the current user labeled "You" when opened', async () => {
        const user = userEvent.setup();
        render(<PaidByPicker members={members} value={CURRENT_USER_ID} onChange={vi.fn()} />);

        await user.click(screen.getByRole('button', { name: 'Paid by' }));

        expect(screen.getByRole('menuitemradio', { name: 'You' })).toBeInTheDocument();
        expect(screen.getByRole('menuitemradio', { name: /priya sharma/i })).toBeInTheDocument();
    });

    it('calls onChange with the selected member id', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        render(<PaidByPicker members={members} value={CURRENT_USER_ID} onChange={onChange} />);

        await user.click(screen.getByRole('button', { name: 'Paid by' }));
        await user.click(screen.getByRole('menuitemradio', { name: /priya sharma/i }));

        expect(onChange).toHaveBeenCalledWith('user-2');
    });
});
