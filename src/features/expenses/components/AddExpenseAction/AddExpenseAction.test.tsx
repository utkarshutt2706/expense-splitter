import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import type { User } from '@data/entities';
import { AddExpenseAction } from './AddExpenseAction';

const members: User[] = [{ id: 'current-user', name: 'Alex Morgan', email: 'alex@example.com' }];

function renderAction(memberList: User[] = members) {
    return render(
        <MemoryRouter>
            <AddExpenseAction groupId="group-1" members={memberList} />
        </MemoryRouter>,
    );
}

describe('AddExpenseAction', () => {
    it('links to the add-expense page for the group when the group has members', () => {
        renderAction();

        expect(screen.getByRole('link', { name: 'Add expense' })).toHaveAttribute(
            'href',
            '/groups/group-1/expenses/new',
        );
    });

    it('renders nothing when the group has no members', () => {
        const { container } = renderAction([]);

        expect(container).toBeEmptyDOMElement();
    });

    it('carries its label on screen, not just in a title attribute', () => {
        renderAction();

        // A hover-only tooltip told a touch reader nothing, which is what made
        // the old icon-only button unguessable.
        expect(screen.getByRole('link', { name: 'Add expense' })).toHaveTextContent('Add expense');
    });

    it('clears the mobile bottom navigation, and returns to the corner above it', () => {
        renderAction();

        const classes = screen.getByRole('link', { name: 'Add expense' }).className.split(/\s+/);

        expect(classes).toContain('bottom-nav-clearance');
        expect(classes).toContain('md:bottom-6');
    });
});
