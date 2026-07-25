import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../storage/models';
import type { IUserRepository } from '../storage/repositories';
import { NotFoundError } from './errors';
import { UserService } from './userService';

vi.mock('./latency', () => ({
    simulateLatency: (operation: () => Promise<unknown>) => operation(),
}));

describe('UserService', () => {
    let repository: IUserRepository;
    let service: UserService;

    const user: User = { id: 'user-1', name: 'Ada Lovelace', email: 'ada@example.com' };

    beforeEach(() => {
        repository = {
            getById: vi.fn(),
            getAll: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        };
        service = new UserService(repository);
    });

    it('returns the user when found', async () => {
        vi.mocked(repository.getById).mockResolvedValue(user);

        await expect(service.getById('user-1')).resolves.toEqual(user);
    });

    it('throws NotFoundError when the user does not exist', async () => {
        vi.mocked(repository.getById).mockResolvedValue(undefined);

        await expect(service.getById('missing')).rejects.toThrow(NotFoundError);
    });

    it('delegates getAll to the repository', async () => {
        vi.mocked(repository.getAll).mockResolvedValue([user]);

        await expect(service.getAll()).resolves.toEqual([user]);
    });

    it('delegates create to the repository', async () => {
        vi.mocked(repository.create).mockResolvedValue(user);

        await expect(service.create(user)).resolves.toEqual(user);
        expect(repository.create).toHaveBeenCalledWith(user);
    });

    it('delegates update to the repository', async () => {
        const updated = { ...user, name: 'Ada, Countess of Lovelace' };
        vi.mocked(repository.update).mockResolvedValue(updated);

        await expect(service.update('user-1', { name: updated.name })).resolves.toEqual(updated);
        expect(repository.update).toHaveBeenCalledWith('user-1', { name: updated.name });
    });

    it('delegates delete to the repository', async () => {
        vi.mocked(repository.delete).mockResolvedValue(undefined);

        await service.delete('user-1');

        expect(repository.delete).toHaveBeenCalledWith('user-1');
    });
});
