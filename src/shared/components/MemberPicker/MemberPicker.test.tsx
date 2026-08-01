import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { MemberPicker } from './MemberPicker';

vi.mock('@app/hooks', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/hooks')>()),
    useCurrentUser: () => ({
        data: { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
    }),
}));

const members: User[] = [
    { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
    { id: 'user-2', name: 'Priya Sharma', email: 'priya@example.com' },
];

function renderPicker(value: string, onChange = vi.fn()) {
    return render(
        <MemberPicker
            members={members}
            value={value}
            onChange={onChange}
            ariaLabel="Paid by"
            placeholder="Select who paid"
        />,
    );
}

describe('MemberPicker', () => {
    it('shows "You" on the trigger when the current user is selected', () => {
        renderPicker(CURRENT_USER_ID);

        expect(screen.getByRole('button', { name: 'Paid by' })).toHaveTextContent('You');
    });

    it("shows the selected member's name on the trigger", () => {
        renderPicker('user-2');

        expect(screen.getByRole('button', { name: 'Paid by' })).toHaveTextContent('Priya Sharma');
    });

    it('shows the placeholder when no member is selected', () => {
        renderPicker('');

        expect(screen.getByRole('button', { name: 'Paid by' })).toHaveTextContent(
            'Select who paid',
        );
    });

    it('lists every member with the current user labeled "You" when opened', async () => {
        const user = userEvent.setup();
        renderPicker(CURRENT_USER_ID);

        await user.click(screen.getByRole('button', { name: 'Paid by' }));

        expect(screen.getByRole('menuitemradio', { name: 'You' })).toBeInTheDocument();
        expect(screen.getByRole('menuitemradio', { name: /priya sharma/i })).toBeInTheDocument();
    });

    it('calls onChange with the selected member id', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        renderPicker(CURRENT_USER_ID, onChange);

        await user.click(screen.getByRole('button', { name: 'Paid by' }));
        await user.click(screen.getByRole('menuitemradio', { name: /priya sharma/i }));

        expect(onChange).toHaveBeenCalledWith('user-2');
    });
});
