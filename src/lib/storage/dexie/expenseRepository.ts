import type { Expense } from '../models';
import type { IExpenseRepository } from '../repositories';
import type { AppDatabase } from './database';

export class DexieExpenseRepository implements IExpenseRepository {
    private readonly db: AppDatabase;

    constructor(db: AppDatabase) {
        this.db = db;
    }

    getById(id: string) {
        return this.db.expenses.get(id);
    }

    getByGroupId(groupId: string) {
        return this.db.expenses.where('groupId').equals(groupId).toArray();
    }

    async create(expense: Expense) {
        await this.db.expenses.add(expense);
        return expense;
    }

    async update(id: string, changes: Partial<Omit<Expense, 'id'>>) {
        await this.db.expenses.update(id, changes);
        const updated = await this.db.expenses.get(id);
        if (!updated) {
            throw new Error(`Expense ${id} not found`);
        }
        return updated;
    }

    async delete(id: string) {
        await this.db.expenses.delete(id);
    }
}
