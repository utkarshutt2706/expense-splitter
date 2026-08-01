import { beforeEach, describe, expect, it } from 'vitest';

import type { Payment } from '../entities';
import { AppDatabase } from './database';
import { DexiePaymentRepository } from './paymentRepository';

describe('DexiePaymentRepository', () => {
    let db: AppDatabase;
    let repository: DexiePaymentRepository;

    beforeEach(() => {
        db = new AppDatabase(crypto.randomUUID());
        repository = new DexiePaymentRepository(db);
    });

    const payment: Payment = {
        id: 'payment-1',
        groupId: 'group-1',
        fromUserId: 'user-1',
        toUserId: 'user-2',
        amount: 25,
        createdAt: '2026-01-01T00:00:00.000Z',
    };

    it('creates a payment', async () => {
        await expect(repository.create(payment)).resolves.toEqual(payment);
    });

    it('lists payments scoped to a group', async () => {
        await repository.create(payment);
        await repository.create({ ...payment, id: 'payment-2', groupId: 'group-2' });

        const payments = await repository.getByGroupId('group-1');

        expect(payments).toEqual([payment]);
    });
});
