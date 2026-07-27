import type { Expense, Group, User } from './entities';
import type { IExpenseRepository, IGroupRepository, IUserRepository } from './repositories';

export const CURRENT_USER_ID = 'current-user';

const FRIEND_PRIYA_ID = 'friend-priya';
const FRIEND_JORDAN_ID = 'friend-jordan';
const WEEKEND_TRIP_GROUP_ID = 'group-weekend-trip';

const seedUsers: User[] = [
    { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
    {
        id: FRIEND_PRIYA_ID,
        name: 'Priya Sharma',
        email: 'priya@example.com',
        phone: '+1 555-010-2020',
    },
    { id: FRIEND_JORDAN_ID, name: 'Jordan Lee', phone: '+1 555-010-3030' },
];

const seedGroups: Group[] = [
    {
        id: WEEKEND_TRIP_GROUP_ID,
        name: 'Weekend Trip',
        memberIds: seedUsers.map((user) => user.id),
        createdAt: '2026-07-01T00:00:00.000Z',
    },
];

const seedExpenses: Expense[] = [
    {
        id: 'expense-dinner',
        groupId: WEEKEND_TRIP_GROUP_ID,
        description: 'Dinner',
        amount: 90,
        paidByUserId: CURRENT_USER_ID,
        splitType: 'equal',
        splits: [
            { userId: CURRENT_USER_ID, amount: 30 },
            { userId: FRIEND_PRIYA_ID, amount: 30 },
            { userId: FRIEND_JORDAN_ID, amount: 30 },
        ],
        createdAt: '2026-07-01T12:00:00.000Z',
    },
    {
        id: 'expense-cab',
        groupId: WEEKEND_TRIP_GROUP_ID,
        description: 'Cab fare',
        amount: 40,
        paidByUserId: FRIEND_PRIYA_ID,
        splitType: 'exact',
        splits: [
            { userId: CURRENT_USER_ID, amount: 25 },
            { userId: FRIEND_JORDAN_ID, amount: 15 },
        ],
        createdAt: '2026-07-01T18:00:00.000Z',
    },
];

interface SeedRepositories {
    users: IUserRepository;
    groups: IGroupRepository;
    expenses: IExpenseRepository;
}

export async function seedDatabase({ users, groups, expenses }: SeedRepositories): Promise<void> {
    const existingUsers = await users.getAll();
    if (existingUsers.length > 0) {
        return;
    }

    await Promise.all(seedUsers.map((user) => users.create(user)));
    await Promise.all(seedGroups.map((group) => groups.create(group)));
    await Promise.all(seedExpenses.map((expense) => expenses.create(expense)));
}
