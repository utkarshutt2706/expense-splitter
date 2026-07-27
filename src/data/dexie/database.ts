import Dexie, { type EntityTable } from 'dexie';

import type { Expense, Group, User } from '../entities';

export class AppDatabase extends Dexie {
    users!: EntityTable<User, 'id'>;
    groups!: EntityTable<Group, 'id'>;
    expenses!: EntityTable<Expense, 'id'>;

    constructor(name = 'expense-splitter') {
        super(name);
        this.version(1).stores({
            users: 'id, name, email',
            groups: 'id, name',
            expenses: 'id, groupId, paidByUserId',
        });
    }
}
