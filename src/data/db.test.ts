import { describe, expect, it } from 'vitest';

import { db, expenseRepository, groupRepository, userRepository } from './db';
import { AppDatabase } from './dexie/database';
import { DexieExpenseRepository } from './dexie/expenseRepository';
import { DexieGroupRepository } from './dexie/groupRepository';
import { DexieUserRepository } from './dexie/userRepository';

describe('db', () => {
    it('wires up a shared database instance and matching repositories', () => {
        expect(db).toBeInstanceOf(AppDatabase);
        expect(userRepository).toBeInstanceOf(DexieUserRepository);
        expect(groupRepository).toBeInstanceOf(DexieGroupRepository);
        expect(expenseRepository).toBeInstanceOf(DexieExpenseRepository);
    });
});
