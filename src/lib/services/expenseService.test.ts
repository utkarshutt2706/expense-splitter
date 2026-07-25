import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Expense } from '../storage/models';
import type { IExpenseRepository } from '../storage/repositories';
import { NotFoundError } from './errors';
import { ExpenseService } from './expenseService';

vi.mock('./latency', () => ({
    simulateLatency: (operation: () => Promise<unknown>) => operation(),
}));

describe('ExpenseService', () => {
    let repository: IExpenseRepository;
    let service: ExpenseService;

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
        createdAt: '2026-07-25T00:00:00.000Z',
    };

    beforeEach(() => {
        repository = {
            getById: vi.fn(),
            getByGroupId: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        };
        service = new ExpenseService(repository);
    });

    it('returns the expense when found', async () => {
        vi.mocked(repository.getById).mockResolvedValue(expense);

        await expect(service.getById('expense-1')).resolves.toEqual(expense);
    });

    it('throws NotFoundError when the expense does not exist', async () => {
        vi.mocked(repository.getById).mockResolvedValue(undefined);

        await expect(service.getById('missing')).rejects.toThrow(NotFoundError);
    });

    it('delegates getByGroupId to the repository', async () => {
        vi.mocked(repository.getByGroupId).mockResolvedValue([expense]);

        await expect(service.getByGroupId('group-1')).resolves.toEqual([expense]);
    });

    it('delegates create to the repository', async () => {
        vi.mocked(repository.create).mockResolvedValue(expense);

        await expect(service.create(expense)).resolves.toEqual(expense);
        expect(repository.create).toHaveBeenCalledWith(expense);
    });

    it('delegates update to the repository', async () => {
        const updated = { ...expense, description: 'Dinner and drinks' };
        vi.mocked(repository.update).mockResolvedValue(updated);

        await expect(
            service.update('expense-1', { description: updated.description }),
        ).resolves.toEqual(updated);
        expect(repository.update).toHaveBeenCalledWith('expense-1', {
            description: updated.description,
        });
    });

    it('delegates delete to the repository', async () => {
        vi.mocked(repository.delete).mockResolvedValue(undefined);

        await service.delete('expense-1');

        expect(repository.delete).toHaveBeenCalledWith('expense-1');
    });
});
