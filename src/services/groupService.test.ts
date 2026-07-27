import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Group } from '@data/entities';
import type { IGroupRepository } from '@data/repositories';
import { NotFoundError } from './errors';
import { GroupService } from './groupService';

vi.mock('./latency', () => ({
    simulateLatency: (operation: () => Promise<unknown>) => operation(),
}));

describe('GroupService', () => {
    let repository: IGroupRepository;
    let service: GroupService;

    const group: Group = {
        id: 'group-1',
        name: 'Trip to Goa',
        memberIds: ['user-1', 'user-2'],
        createdAt: '2026-07-25T00:00:00.000Z',
    };

    beforeEach(() => {
        repository = {
            getById: vi.fn(),
            getAll: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        };
        service = new GroupService(repository);
    });

    it('returns the group when found', async () => {
        vi.mocked(repository.getById).mockResolvedValue(group);

        await expect(service.getById('group-1')).resolves.toEqual(group);
    });

    it('throws NotFoundError when the group does not exist', async () => {
        vi.mocked(repository.getById).mockResolvedValue(undefined);

        await expect(service.getById('missing')).rejects.toThrow(NotFoundError);
    });

    it('delegates getAll to the repository', async () => {
        vi.mocked(repository.getAll).mockResolvedValue([group]);

        await expect(service.getAll()).resolves.toEqual([group]);
    });

    it('delegates create to the repository', async () => {
        vi.mocked(repository.create).mockResolvedValue(group);

        await expect(service.create(group)).resolves.toEqual(group);
        expect(repository.create).toHaveBeenCalledWith(group);
    });

    it('delegates update to the repository', async () => {
        const updated = { ...group, name: 'Goa Trip 2026' };
        vi.mocked(repository.update).mockResolvedValue(updated);

        await expect(service.update('group-1', { name: updated.name })).resolves.toEqual(updated);
        expect(repository.update).toHaveBeenCalledWith('group-1', { name: updated.name });
    });

    it('delegates delete to the repository', async () => {
        vi.mocked(repository.delete).mockResolvedValue(undefined);

        await service.delete('group-1');

        expect(repository.delete).toHaveBeenCalledWith('group-1');
    });
});
