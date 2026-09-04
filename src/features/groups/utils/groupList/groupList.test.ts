import { describe, expect, it } from 'vitest';

import type { GroupSummary } from '@features/groups/api/groupsApi';

import { filterGroups, sortGroups } from './groupList';

function group(overrides: Partial<GroupSummary> & Pick<GroupSummary, 'id' | 'name'>): GroupSummary {
    return {
        memberIds: [],
        memberCount: 0,
        currentUserBalance: 0,
        hasFinancialActivity: false,
        lastActivityAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        ...overrides,
    };
}

describe('groupList', () => {
    describe('sortGroups', () => {
        it('sorts active groups by newest activity and places inactive groups last', () => {
            const groups = [
                group({ id: 'inactive', name: 'Inactive' }),
                group({
                    id: 'older',
                    name: 'Older activity',
                    lastActivityAt: '2026-02-01T00:00:00.000Z',
                }),
                group({
                    id: 'newer',
                    name: 'Newer activity',
                    lastActivityAt: '2026-03-01T00:00:00.000Z',
                }),
            ];

            expect(sortGroups(groups).map(({ id }) => id)).toEqual(['newer', 'older', 'inactive']);
        });

        it('uses group name as the alphabetical tie-breaker', () => {
            const groups = [
                group({ id: 'zebra', name: 'Zebra', lastActivityAt: '2026-03-01T00:00:00.000Z' }),
                group({ id: 'alpha', name: 'Alpha', lastActivityAt: '2026-03-01T00:00:00.000Z' }),
                group({ id: 'yoga', name: 'Yoga' }),
                group({ id: 'books', name: 'Books' }),
            ];

            expect(sortGroups(groups).map(({ id }) => id)).toEqual([
                'alpha',
                'zebra',
                'books',
                'yoga',
            ]);
        });

        it('does not mutate the input array', () => {
            const groups = [
                group({ id: 'inactive', name: 'Inactive' }),
                group({
                    id: 'active',
                    name: 'Active',
                    lastActivityAt: '2026-03-01T00:00:00.000Z',
                }),
            ];
            const originalOrder = [...groups];

            const result = sortGroups(groups);

            expect(groups).toEqual(originalOrder);
            expect(result).not.toBe(groups);
        });

        it('returns an empty array for an empty collection', () => {
            expect(sortGroups([])).toEqual([]);
        });
    });

    describe('filterGroups', () => {
        const groups = [
            group({
                id: 'trip',
                name: 'Summer Trip',
                memberIds: ['alex'],
                lastActivityAt: '2026-02-01T00:00:00.000Z',
            }),
            group({
                id: 'home',
                name: 'Household',
                memberIds: ['sam'],
                lastActivityAt: '2026-03-01T00:00:00.000Z',
            }),
            group({ id: 'games', name: 'Game Night', memberIds: ['taylor'] }),
        ];
        const memberNames = new Map([
            ['alex', 'Alex Morgan'],
            ['sam', 'Sam Rivera'],
            ['taylor', 'Taylor Kim'],
        ]);

        it('filters by group name', () => {
            expect(filterGroups(groups, 'summer', memberNames).map(({ id }) => id)).toEqual([
                'trip',
            ]);
        });

        it('filters by member name', () => {
            expect(filterGroups(groups, 'taylor', memberNames).map(({ id }) => id)).toEqual([
                'games',
            ]);
        });

        it('normalizes query case and surrounding whitespace', () => {
            expect(filterGroups(groups, '  aLeX  ', memberNames).map(({ id }) => id)).toEqual([
                'trip',
            ]);
            expect(filterGroups(groups, '  HOUSE  ', memberNames).map(({ id }) => id)).toEqual([
                'home',
            ]);
        });

        it('returns every group in sorted order for an empty or whitespace-only query', () => {
            expect(filterGroups(groups, '', memberNames).map(({ id }) => id)).toEqual([
                'home',
                'trip',
                'games',
            ]);
            expect(filterGroups(groups, '   ', memberNames).map(({ id }) => id)).toEqual([
                'home',
                'trip',
                'games',
            ]);
        });

        it('returns an empty array for an empty collection or when no group matches', () => {
            expect(filterGroups([], 'trip', memberNames)).toEqual([]);
            expect(filterGroups(groups, 'missing', memberNames)).toEqual([]);
        });

        it('does not mutate the input array', () => {
            const originalOrder = [...groups];

            filterGroups(groups, '', memberNames);

            expect(groups).toEqual(originalOrder);
        });
    });
});
