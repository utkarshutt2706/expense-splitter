import { beforeEach, describe, expect, it } from 'vitest';

import type { User } from '../entities';
import { AppDatabase } from './database';
import { DexieUserRepository } from './userRepository';

describe('DexieUserRepository', () => {
    let db: AppDatabase;
    let repository: DexieUserRepository;

    beforeEach(() => {
        db = new AppDatabase(crypto.randomUUID());
        repository = new DexieUserRepository(db);
    });

    const user: User = { id: 'user-1', name: 'Ada Lovelace', email: 'ada@example.com' };

    it('creates and retrieves a user by id', async () => {
        await repository.create(user);

        await expect(repository.getById('user-1')).resolves.toEqual(user);
    });

    it('returns undefined for a user that does not exist', async () => {
        await expect(repository.getById('missing')).resolves.toBeUndefined();
    });

    it('lists all users', async () => {
        await repository.create(user);
        await repository.create({ id: 'user-2', name: 'Grace Hopper', email: 'grace@example.com' });

        const users = await repository.getAll();

        expect(users).toHaveLength(2);
    });

    it('updates a user and returns the updated record', async () => {
        await repository.create(user);

        const updated = await repository.update('user-1', { name: 'Ada, Countess of Lovelace' });

        expect(updated.name).toBe('Ada, Countess of Lovelace');
    });

    it('throws when updating a user that does not exist', async () => {
        await expect(repository.update('missing', { name: 'Nobody' })).rejects.toThrow(
            'User missing not found',
        );
    });

    it('deletes a user', async () => {
        await repository.create(user);

        await repository.delete('user-1');

        await expect(repository.getById('user-1')).resolves.toBeUndefined();
    });
});
