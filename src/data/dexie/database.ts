import Dexie, { type EntityTable } from 'dexie';

import type { Expense, Group, Payment, User } from '../entities';

export class AppDatabase extends Dexie {
    users!: EntityTable<User, 'id'>;
    groups!: EntityTable<Group, 'id'>;
    expenses!: EntityTable<Expense, 'id'>;
    payments!: EntityTable<Payment, 'id'>;

    constructor(name = 'expense-splitter') {
        super(name);
        this.version(1).stores({
            users: 'id, name, email',
            groups: 'id, name',
            expenses: 'id, groupId, paidByUserId',
        });
        this.version(2).stores({
            payments: 'id, groupId, fromUserId, toUserId',
        });
    }
}
