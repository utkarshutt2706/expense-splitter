import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { Friend } from '@features/friends/api/friendsApi';
import { FriendRow } from './FriendRow';

vi.mock('@features/friends/components/ContactAction', () => ({
    ContactAction: ({ kind, value }: { kind: string; value: string }) => (
        <span>
            {kind}:{value}
        </span>
    ),
}));
vi.mock('@shared/components', () => ({
    Avatar: ({ name }: { name: string }) => <span>Avatar:{name}</span>,
    ResponsivePopoverContent: ({
        children,
        sideOffset: _sideOffset,
        collisionPadding: _collisionPadding,
        ...props
    }: React.HTMLAttributes<HTMLDivElement> & {
        sideOffset?: number;
        collisionPadding?: number;
    }) => <div {...props}>{children}</div>,
}));

const friend = (overrides: Partial<Friend> = {}): Friend => ({
    id: 'friend',
    name: 'Alex',
    email: 'alex@example.com',
    phone: '+91123',
    sharedGroupCount: 2,
    netBalance: 0,
    groupBalances: [],
    ...overrides,
});
const renderRow = (value: Friend) =>
    render(
        <MemoryRouter>
            <ul>
                <FriendRow friend={value} />
            </ul>
        </MemoryRouter>,
    );

describe('FriendRow', () => {
    it('renders identity, contacts, shared groups, and settled status', () => {
        renderRow(friend());
        expect(screen.getByText('Alex')).toBeInTheDocument();
        expect(screen.getByText('email:alex@example.com')).toBeInTheDocument();
        expect(screen.getByText('phone:+91123')).toBeInTheDocument();
        expect(screen.getByText('2 shared groups')).toBeInTheDocument();
        expect(screen.getByText('Settled up')).toBeInTheDocument();
    });

    it.each([
        [25, 'Owes you ₹25.00'],
        [-30, 'You owe ₹30.00'],
    ] as const)('shows directional net balance %s', (netBalance, text) => {
        renderRow(friend({ netBalance }));
        expect(screen.getByText(text)).toBeInTheDocument();
    });

    it('shows per-group balance links in the disclosure', () => {
        renderRow(
            friend({
                sharedGroupCount: 1,
                groupBalances: [
                    { groupId: 'trip', groupName: 'Trip', balance: 20 },
                    { groupId: 'home', groupName: 'Home', balance: -10 },
                ],
            }),
        );
        fireEvent.click(screen.getByRole('button', { name: 'View balance breakdown with Alex' }));
        expect(screen.getByText('1 shared group')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Trip.*Owes you ₹20.00/ })).toHaveAttribute(
            'href',
            '/groups/trip',
        );
        expect(screen.getByRole('link', { name: /Home.*You owe ₹10.00/ })).toHaveAttribute(
            'href',
            '/groups/home',
        );
    });

    it('uses unavailable wording when aggregate group details are absent', () => {
        renderRow(
            friend({
                sharedGroupCount: undefined,
                groupBalances: undefined,
                email: undefined,
                phone: undefined,
            }),
        );
        expect(screen.getByText('Shared-group details unavailable')).toBeInTheDocument();
        expect(screen.queryByText(/email:|phone:/)).not.toBeInTheDocument();
    });
});
