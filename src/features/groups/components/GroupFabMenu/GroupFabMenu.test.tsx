import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { GroupFabMenu } from './GroupFabMenu';

vi.mock('@features/expenses', () => ({
    AddExpenseAction: ({ onTriggerClick }: { onTriggerClick?: () => void }) => (
        <button type="button" onClick={onTriggerClick}>
            Fake add expense trigger
        </button>
    ),
}));

vi.mock('@features/payments', () => ({
    RecordPaymentAction: ({ onTriggerClick }: { onTriggerClick?: () => void }) => (
        <button type="button" onClick={onTriggerClick}>
            Fake record payment trigger
        </button>
    ),
}));

vi.mock('@features/balances/components/SettleUpAction', () => ({
    SettleUpAction: () => (
        <button type="button" disabled>
            Settle up
        </button>
    ),
}));

const members: User[] = [{ id: 'user-1', name: 'Alex Morgan', email: 'alex@example.com' }];

function fanButton(name: string | RegExp) {
    return screen.getByRole('button', { name });
}

describe('GroupFabMenu', () => {
    it('starts collapsed, showing the open-menu toggle with the fan hidden', () => {
        render(<GroupFabMenu groupId="group-1" members={members} />);

        const toggle = screen.getByRole('button', { name: 'Open actions menu' });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        expect(toggle).toHaveAttribute('title', 'Open actions menu');
        // The fan items are always mounted (so the reveal can animate) rather than
        // conditionally rendered, so "closed" is asserted via visibility, not
        // absence from the DOM.
        expect(fanButton(/fake add expense trigger/i)).not.toBeVisible();
        expect(fanButton(/fake record payment trigger/i)).not.toBeVisible();
        expect(fanButton('Settle up')).not.toBeVisible();
    });

    it('reveals the fan of actions and swaps to the close-menu toggle when clicked', async () => {
        const user = userEvent.setup();
        render(<GroupFabMenu groupId="group-1" members={members} />);

        await user.click(screen.getByRole('button', { name: 'Open actions menu' }));

        const toggle = screen.getByRole('button', { name: 'Close actions menu' });
        expect(toggle).toHaveAttribute('aria-expanded', 'true');
        expect(toggle).toHaveAttribute('title', 'Close actions menu');
        expect(fanButton(/fake add expense trigger/i)).toBeVisible();
        expect(fanButton(/fake record payment trigger/i)).toBeVisible();
        expect(fanButton('Settle up')).toBeVisible();
    });

    it('hides the fan again when the toggle is clicked a second time', async () => {
        const user = userEvent.setup();
        render(<GroupFabMenu groupId="group-1" members={members} />);

        await user.click(screen.getByRole('button', { name: 'Open actions menu' }));
        await user.click(screen.getByRole('button', { name: 'Close actions menu' }));

        expect(fanButton(/fake add expense trigger/i)).not.toBeVisible();
    });

    it('hides the fan when a sub-action is triggered', async () => {
        const user = userEvent.setup();
        render(<GroupFabMenu groupId="group-1" members={members} />);

        await user.click(screen.getByRole('button', { name: 'Open actions menu' }));
        await user.click(fanButton(/fake add expense trigger/i));

        expect(fanButton(/fake add expense trigger/i)).not.toBeVisible();
    });

    it('sits above the mobile bottom navigation, and back at the corner once it is gone', () => {
        render(<GroupFabMenu groupId="group-1" members={members} />);

        const toggle = screen.getByRole('button', { name: /open actions menu/i });
        const classes = toggle.className.split(/\s+/);

        // Without this the button lands under the fixed bottom bar on mobile.
        expect(classes).toContain('bottom-nav-clearance');
        // The bar is md:hidden, so the plain corner offset returns from md up.
        expect(classes).toContain('md:bottom-6');
    });

    it('anchors the fan to the same point as the toggle', () => {
        const { container } = render(<GroupFabMenu groupId="group-1" members={members} />);

        // The fan offsets are measured from the toggle's own position, so a
        // mismatch here would leave the actions floating away from the button.
        const anchors = container.querySelectorAll('.bottom-nav-clearance');
        expect(anchors.length).toBeGreaterThan(1);

        for (const anchor of anchors) {
            expect(anchor.className).toContain('md:bottom-6');
        }
    });
});
