import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import type { GroupSummary } from '@features/groups/api/groupsApi';

import { GroupCard } from './GroupCard';

function group(overrides: Partial<GroupSummary> = {}): GroupSummary {
    return {
        id: 'group-1',
        name: 'Weekend Trip',
        memberIds: ['current', 'friend'],
        memberCount: 2,
        currentUserBalance: 0,
        hasFinancialActivity: true,
        lastActivityAt: '2026-08-10T00:00:00.000Z',
        createdAt: '2026-08-01T00:00:00.000Z',
        ...overrides,
    };
}

function renderCard(value: GroupSummary) {
    return render(
        <MemoryRouter>
            <GroupCard group={value} />
        </MemoryRouter>,
    );
}

describe('GroupCard', () => {
    it('links to the group and presents membership and recent activity', () => {
        renderCard(group());
        expect(screen.getByRole('link', { name: /Weekend Trip/ })).toHaveAttribute(
            'href',
            '/groups/group-1',
        );
        expect(screen.getByText('2 members')).toBeInTheDocument();
        expect(screen.getByText('Last activity 10 Aug 2026')).toBeInTheDocument();
        expect(screen.getAllByText('Settled up')).toHaveLength(2);
    });

    it('uses singular membership and empty activity wording', () => {
        renderCard(group({ memberCount: 1, lastActivityAt: null, hasFinancialActivity: false }));
        expect(screen.getByText('1 member')).toBeInTheDocument();
        expect(screen.getByText('No expenses yet')).toBeInTheDocument();
        expect(screen.getAllByText('No balance')).toHaveLength(2);
    });

    it.each([
        [125.5, 'You are owed ₹125.50'],
        [-75.25, 'You owe ₹75.25'],
        [0, 'Settled up'],
    ])('renders the balance status for %s', (balance, expected) => {
        renderCard(group({ currentUserBalance: balance }));
        expect(screen.getAllByText(expected)).toHaveLength(2);
    });
});
