import { describe, expect, it, vi } from 'vitest';

import type { Group } from './groupsApi';
import { httpClient } from '@lib/api/httpClient';
import { create, getAll, getAllSummaries, getById, remove, update } from './groupsApi';

vi.mock('@lib/api/httpClient', () => ({
    httpClient: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}));

const group: Group = {
    id: 'group-1',
    name: 'Weekend Trip',
    memberIds: ['current-user', 'friend-1'],
    createdAt: '2026-07-01T00:00:00.000Z',
};

describe('groupsApi', () => {
    it('getAll fetches the group list from /groups', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: [group] });

        const groups = await getAll();

        expect(httpClient.get).toHaveBeenCalledWith('/groups');
        expect(groups).toEqual([group]);
    });

    it('getById fetches a single group from /groups/:id', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: group });

        const result = await getById('group-1');

        expect(httpClient.get).toHaveBeenCalledWith('/groups/group-1');
        expect(result).toEqual(group);
    });

    it('getAllSummaries fetches the group summary list', async () => {
        const summary = {
            ...group,
            memberCount: 2,
            currentUserBalance: 45,
            hasFinancialActivity: true,
            lastActivityAt: '2026-08-30T12:00:00.000Z',
        };
        vi.mocked(httpClient.get).mockResolvedValue({ data: [summary] });

        const result = await getAllSummaries();

        expect(httpClient.get).toHaveBeenCalledWith('/groups/summaries');
        expect(result).toEqual([summary]);
    });

    it('create posts a new group to /groups', async () => {
        vi.mocked(httpClient.post).mockResolvedValue({ data: group });

        const result = await create({
            name: 'Weekend Trip',
            memberIds: ['current-user', 'friend-1'],
        });

        expect(httpClient.post).toHaveBeenCalledWith('/groups', {
            name: 'Weekend Trip',
            memberIds: ['current-user', 'friend-1'],
        });
        expect(result).toEqual(group);
    });

    it('update patches the group at /groups/:id', async () => {
        const renamed = { ...group, name: 'Ski Trip' };
        vi.mocked(httpClient.patch).mockResolvedValue({ data: renamed });

        const result = await update('group-1', { name: 'Ski Trip' });

        expect(httpClient.patch).toHaveBeenCalledWith('/groups/group-1', { name: 'Ski Trip' });
        expect(result).toEqual(renamed);
    });

    it('remove deletes the group at /groups/:id', async () => {
        vi.mocked(httpClient.delete).mockResolvedValue({ data: undefined });

        await remove('group-1');

        expect(httpClient.delete).toHaveBeenCalledWith('/groups/group-1');
    });
});
