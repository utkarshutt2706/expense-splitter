import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { MemberList } from './MemberList';

vi.mock('@app/hooks', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/hooks')>()),
    useCurrentUser: () => ({
        data: { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
    }),
}));

const members: User[] = [
    { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' },
    { id: 'friend-2', name: 'Jordan Lee', phone: '5551234567' },
    { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
];

describe('MemberList', () => {
    it('renders every member with their name and contact info', () => {
        render(<MemberList members={members} />);

        expect(screen.getByText('Priya')).toBeInTheDocument();
        expect(screen.getByText('priya@example.com')).toBeInTheDocument();
        expect(screen.getByText('Jordan')).toBeInTheDocument();
        expect(screen.getByText('5551234567')).toBeInTheDocument();
    });

    it('labels the current user as "You" instead of their name', () => {
        render(<MemberList members={members} />);

        expect(screen.getByText('You')).toBeInTheDocument();
        expect(screen.queryByText('Alex Morgan')).not.toBeInTheDocument();
    });

    it('always lists the current user first, regardless of input order', () => {
        render(<MemberList members={members} />);

        const names = screen.getAllByRole('listitem').map((item) => item.textContent);
        expect(names[0]).toContain('You');
    });

    it('orders the remaining members alphabetically below the current user', () => {
        const unsorted: User[] = [
            { id: 'friend-3', name: 'Zoe Tan' },
            { id: 'friend-1', name: 'Priya Sharma' },
            { id: CURRENT_USER_ID, name: 'Alex Morgan' },
            { id: 'friend-2', name: 'Arun Nair' },
        ];

        render(<MemberList members={unsorted} />);

        const names = screen
            .getAllByRole('listitem')
            .map((item) => item.querySelector('p')?.textContent ?? '');
        expect(names).toEqual(['You', 'Arun', 'Priya', 'Zoe']);
    });
});
