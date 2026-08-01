import { describe, expect, it } from 'vitest';

import { db, expenseRepository, groupRepository, paymentRepository, userRepository } from './db';
import { AppDatabase } from './dexie/database';
import { DexieExpenseRepository } from './dexie/expenseRepository';
import { DexieGroupRepository } from './dexie/groupRepository';
import { DexiePaymentRepository } from './dexie/paymentRepository';
import { DexieUserRepository } from './dexie/userRepository';

describe('db', () => {
    it('wires up a shared database instance and matching repositories', () => {
        expect(db).toBeInstanceOf(AppDatabase);
        expect(userRepository).toBeInstanceOf(DexieUserRepository);
        expect(groupRepository).toBeInstanceOf(DexieGroupRepository);
        expect(expenseRepository).toBeInstanceOf(DexieExpenseRepository);
        expect(paymentRepository).toBeInstanceOf(DexiePaymentRepository);
    });
});
