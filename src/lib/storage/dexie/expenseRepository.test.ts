import { beforeEach, describe, expect, it } from 'vitest';
import type { SplitType } from '../models';
import type { Expense } from '../models';
import { AppDatabase } from './database';
import { DexieExpenseRepository } from './expenseRepository';

describe('DexieExpenseRepository', () => {
    let db: AppDatabase;
    let repository: DexieExpenseRepository;

    beforeEach(() => {
        db = new AppDatabase(crypto.randomUUID());
        repository = new DexieExpenseRepository(db);
    });

    const expense: Expense = {
        id: 'expense-1',
        groupId: 'group-1',
        description: 'Dinner',
        amount: 60,
        paidByUserId: 'user-1',
        splitType: 'equal',
        splits: [
            { userId: 'user-1', amount: 30 },
            { userId: 'user-2', amount: 30 },
        ],
        createdAt: '2026-01-01T00:00:00.000Z',
    };

    it('creates and retrieves an expense by id', async () => {
        await repository.create(expense);

        await expect(repository.getById('expense-1')).resolves.toEqual(expense);
    });

    it('lists expenses scoped to a group', async () => {
        await repository.create(expense);
        await repository.create({ ...expense, id: 'expense-2', groupId: 'group-2' });

        const expenses = await repository.getByGroupId('group-1');

        expect(expenses).toEqual([expense]);
    });

    it('updates an expense and returns the updated record', async () => {
        await repository.create(expense);

        const updated = await repository.update('expense-1', { amount: 75 });

        expect(updated.amount).toBe(75);
    });

    it('throws when updating an expense that does not exist', async () => {
        await expect(repository.update('missing', { amount: 10 })).rejects.toThrow(
            'Expense missing not found',
        );
    });

    const splitsByType: Record<SplitType, Expense['splits']> = {
        equal: [
            { userId: 'user-1', amount: 30 },
            { userId: 'user-2', amount: 30 },
        ],
        exact: [
            { userId: 'user-1', amount: 45 },
            { userId: 'user-2', amount: 15 },
        ],
        percentage: [
            { userId: 'user-1', amount: 24 },
            { userId: 'user-2', amount: 36 },
        ],
        shares: [
            { userId: 'user-1', amount: 20 },
            { userId: 'user-2', amount: 40 },
        ],
    };

    it.each(Object.entries(splitsByType))('round-trips a %s split', async (splitType, splits) => {
        const record: Expense = {
            ...expense,
            id: `expense-${splitType}`,
            splitType: splitType as SplitType,
            splits,
        };

        await repository.create(record);

        await expect(repository.getById(record.id)).resolves.toEqual(record);
    });

    it('deletes an expense', async () => {
        await repository.create(expense);

        await repository.delete('expense-1');

        await expect(repository.getById('expense-1')).resolves.toBeUndefined();
    });
});
