import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { AddExpenseAction } from './AddExpenseAction';

const members: User[] = [{ id: 'current-user', name: 'Alex Morgan', email: 'alex@example.com' }];

function renderAction(memberList: User[] = members, onTriggerClick?: () => void) {
    return render(
        <MemoryRouter>
            <AddExpenseAction
                groupId="group-1"
                members={memberList}
                onTriggerClick={onTriggerClick}
            />
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

    it('calls onTriggerClick when the add expense link is clicked', async () => {
        const onTriggerClick = vi.fn();
        const user = userEvent.setup();
        renderAction(members, onTriggerClick);

        await user.click(screen.getByRole('link', { name: 'Add expense' }));

        expect(onTriggerClick).toHaveBeenCalled();
    });
});
