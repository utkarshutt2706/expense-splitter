import type { Payment } from '../entities';
import type { IPaymentRepository } from '../repositories';
import type { AppDatabase } from './database';

export class DexiePaymentRepository implements IPaymentRepository {
    private readonly db: AppDatabase;

    constructor(db: AppDatabase) {
        this.db = db;
    }

    getByGroupId(groupId: string) {
        return this.db.payments.where('groupId').equals(groupId).toArray();
    }

    async create(payment: Payment) {
        await this.db.payments.add(payment);
        return payment;
    }
}
