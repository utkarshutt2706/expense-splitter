import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@features/users/api/usersApi';
import { CURRENT_USER_ID } from '@test/fixtures/ids';
import { MemberPicker } from './MemberPicker';

const { currentUser } = vi.hoisted(() => ({
    currentUser: {
        value: { id: 'current-user', name: 'Alex Morgan', email: 'alex@example.com' } as
            { id: string; name: string; email: string } | undefined,
    },
}));

vi.mock('@app/hooks', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/hooks')>()),
    useCurrentUser: () => ({
        data: currentUser.value,
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
    beforeEach(() => {
        currentUser.value = {
            id: CURRENT_USER_ID,
            name: 'Alex Morgan',
            email: 'alex@example.com',
        };
    });

    it('shows "You" on the trigger when the current user is selected', () => {
        renderPicker(CURRENT_USER_ID);

        expect(screen.getByRole('button', { name: 'Paid by' })).toHaveTextContent('You');
    });

    it("shows the selected member's name on the trigger", () => {
        renderPicker('user-2');

        expect(screen.getByRole('button', { name: 'Paid by' })).toHaveTextContent('Priya');
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

    it('orders the options alphabetically with the current user first', async () => {
        const user = userEvent.setup();
        const unsorted: User[] = [
            { id: 'user-3', name: 'Zoe Tan' },
            { id: 'user-2', name: 'Priya Sharma' },
            { id: CURRENT_USER_ID, name: 'Alex Morgan' },
            { id: 'user-4', name: 'Arun Nair' },
        ];
        render(
            <MemberPicker
                members={unsorted}
                value={CURRENT_USER_ID}
                onChange={vi.fn()}
                ariaLabel="Paid by"
                placeholder="Select who paid"
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Paid by' }));

        // The avatar is an aria-hidden sibling rendering initials, so read only
        // the option's own text node.
        const optionLabel = (item: HTMLElement) =>
            Array.from(item.childNodes)
                .filter((node) => node.nodeType === Node.TEXT_NODE)
                .map((node) => node.textContent)
                .join('')
                .trim();

        expect(screen.getAllByRole('menuitemradio').map(optionLabel)).toEqual([
            'You',
            'Arun',
            'Priya',
            'Zoe',
        ]);
    });

    it('works without current-user data and does not label any option as You', async () => {
        currentUser.value = undefined;
        const user = userEvent.setup();
        renderPicker(CURRENT_USER_ID);

        expect(screen.getByRole('button', { name: 'Paid by' })).toHaveTextContent('Alex');
        await user.click(screen.getByRole('button', { name: 'Paid by' }));

        expect(screen.queryByRole('menuitemradio', { name: 'You' })).not.toBeInTheDocument();
        expect(screen.getByRole('menuitemradio', { name: /alex morgan/i })).toBeInTheDocument();
    });

    it('renders an empty menu and placeholder when no members are available', async () => {
        const user = userEvent.setup();
        render(
            <MemberPicker
                members={[]}
                value="missing-user"
                onChange={vi.fn()}
                ariaLabel="Paid by"
                placeholder="Nobody available"
            />,
        );

        expect(screen.getByRole('button', { name: 'Paid by' })).toHaveTextContent(
            'Nobody available',
        );
        await user.click(screen.getByRole('button', { name: 'Paid by' }));
        expect(screen.queryAllByRole('menuitemradio')).toHaveLength(0);
    });

    it('disambiguates duplicate first names in the trigger and options', async () => {
        const user = userEvent.setup();
        const duplicateNames: User[] = [
            { id: CURRENT_USER_ID, name: 'Alex Morgan' },
            { id: 'user-2', name: 'Alex Sharma' },
        ];
        render(
            <MemberPicker
                members={duplicateNames}
                value="user-2"
                onChange={vi.fn()}
                ariaLabel="Paid by"
                placeholder="Select"
            />,
        );

        expect(screen.getByRole('button', { name: 'Paid by' })).toHaveTextContent('Alex S');
        await user.click(screen.getByRole('button', { name: 'Paid by' }));
        expect(screen.getByRole('menuitemradio', { name: 'Alex Sharma' })).toHaveTextContent(
            'Alex S',
        );
    });
});
