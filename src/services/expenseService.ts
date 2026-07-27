import type { Expense } from '@data/entities';
import type { IExpenseRepository } from '@data/repositories';
import { NotFoundError } from './errors';
import { simulateLatency } from './latency';

export class ExpenseService {
    private readonly repository: IExpenseRepository;

    constructor(repository: IExpenseRepository) {
        this.repository = repository;
    }

    async getById(id: string): Promise<Expense> {
        const expense = await simulateLatency(() => this.repository.getById(id));
        if (!expense) {
            throw new NotFoundError('Expense', id);
        }
        return expense;
    }

    getByGroupId(groupId: string): Promise<Expense[]> {
        return simulateLatency(() => this.repository.getByGroupId(groupId));
    }

    create(expense: Expense): Promise<Expense> {
        return simulateLatency(() => this.repository.create(expense));
    }

    update(id: string, changes: Partial<Omit<Expense, 'id'>>): Promise<Expense> {
        return simulateLatency(() => this.repository.update(id, changes));
    }

    delete(id: string): Promise<void> {
        return simulateLatency(() => this.repository.delete(id));
    }
}
