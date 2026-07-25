import { beforeEach, describe, expect, it } from 'vitest';
import type { Group } from '../models';
import { AppDatabase } from './database';
import { DexieGroupRepository } from './groupRepository';

describe('DexieGroupRepository', () => {
    let db: AppDatabase;
    let repository: DexieGroupRepository;

    beforeEach(() => {
        db = new AppDatabase(crypto.randomUUID());
        repository = new DexieGroupRepository(db);
    });

    const group: Group = {
        id: 'group-1',
        name: 'Goa Trip',
        memberIds: ['user-1', 'user-2'],
        createdAt: '2026-01-01T00:00:00.000Z',
    };

    it('creates and retrieves a group by id', async () => {
        await repository.create(group);

        await expect(repository.getById('group-1')).resolves.toEqual(group);
    });

    it('lists all groups', async () => {
        await repository.create(group);
        await repository.create({ ...group, id: 'group-2', name: 'Roommates' });

        const groups = await repository.getAll();

        expect(groups).toHaveLength(2);
    });

    it('updates a group and returns the updated record', async () => {
        await repository.create(group);

        const updated = await repository.update('group-1', {
            memberIds: ['user-1', 'user-2', 'user-3'],
        });

        expect(updated.memberIds).toEqual(['user-1', 'user-2', 'user-3']);
    });

    it('throws when updating a group that does not exist', async () => {
        await expect(repository.update('missing', { name: 'Nobody' })).rejects.toThrow(
            'Group missing not found',
        );
    });

    it('deletes a group', async () => {
        await repository.create(group);

        await repository.delete('group-1');

        await expect(repository.getById('group-1')).resolves.toBeUndefined();
    });
});
