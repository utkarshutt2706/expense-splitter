import { AppDatabase } from './dexie/database';
import { DexieExpenseRepository } from './dexie/expenseRepository';
import { DexieGroupRepository } from './dexie/groupRepository';
import { DexiePaymentRepository } from './dexie/paymentRepository';
import { DexieUserRepository } from './dexie/userRepository';

export const db = new AppDatabase();
export const userRepository = new DexieUserRepository(db);
export const groupRepository = new DexieGroupRepository(db);
export const expenseRepository = new DexieExpenseRepository(db);
export const paymentRepository = new DexiePaymentRepository(db);
