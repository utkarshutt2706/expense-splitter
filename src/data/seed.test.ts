import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Expense, Group, User } from './entities';
import type { IExpenseRepository, IGroupRepository, IUserRepository } from './repositories';
import { CURRENT_USER_ID, seedDatabase } from './seed';

describe('seedDatabase', () => {
    let users: IUserRepository;
    let groups: IGroupRepository;
    let expenses: IExpenseRepository;
    let existingUsers: User[];

    beforeEach(() => {
        existingUsers = [];
        users = {
            getById: vi.fn(),
            getAll: vi.fn(() => Promise.resolve(existingUsers)),
            create: vi.fn((user: User) => Promise.resolve(user)),
            update: vi.fn(),
            delete: vi.fn(),
        };
        groups = {
            getById: vi.fn(),
            getAll: vi.fn(),
            create: vi.fn((group: Group) => Promise.resolve(group)),
            update: vi.fn(),
            delete: vi.fn(),
        };
        expenses = {
            getById: vi.fn(),
            getByGroupId: vi.fn(),
            create: vi.fn((expense: Expense) => Promise.resolve(expense)),
            update: vi.fn(),
            delete: vi.fn(),
        };
    });

    it('creates the current user, friends, group, and expenses when the database is empty', async () => {
        await seedDatabase({ users, groups, expenses });

        expect(users.create).toHaveBeenCalledTimes(3);
        expect(users.create).toHaveBeenCalledWith(expect.objectContaining({ id: CURRENT_USER_ID }));
        expect(groups.create).toHaveBeenCalledTimes(1);
        expect(expenses.create).toHaveBeenCalledTimes(2);
    });

    it('includes the current user in the seeded group membership', async () => {
        await seedDatabase({ users, groups, expenses });

        const [seededGroup] = vi.mocked(groups.create).mock.calls[0]!;
        expect(seededGroup.memberIds).toContain(CURRENT_USER_ID);
    });

    it('does nothing when users already exist', async () => {
        existingUsers = [{ id: 'user-1', name: 'Existing User', email: 'existing@example.com' }];

        await seedDatabase({ users, groups, expenses });

        expect(users.create).not.toHaveBeenCalled();
        expect(groups.create).not.toHaveBeenCalled();
        expect(expenses.create).not.toHaveBeenCalled();
    });
});
