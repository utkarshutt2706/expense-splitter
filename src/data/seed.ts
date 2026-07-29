import type { Expense, Group, User } from './entities';
import type { IExpenseRepository, IGroupRepository, IUserRepository } from './repositories';

export const CURRENT_USER_ID = 'current-user';

const FRIEND_ABHAY_ID = 'friend-abhay';
const FRIEND_DIVANSHU_ID = 'friend-divanshu';
const FRIEND_ABHINAV_ID = 'friend-abhinav';
const FRIEND_KHEM_ID = 'friend-khem';
const DAARU_PARTY_GROUP_ID = 'group-daaru-party';

const seedUsers: User[] = [
    {
        id: CURRENT_USER_ID,
        name: 'Utkarsh Srivastava',
        email: 'utkarshutt2706@gmail.com',
        phone: '9935744820',
    },
    {
        id: FRIEND_ABHAY_ID,
        name: 'Abhay',
        email: 'abhay.verma@example.com',
        phone: '9876543210',
    },
    {
        id: FRIEND_DIVANSHU_ID,
        name: 'Divanshu',
        email: 'divanshu.gupta@example.com',
        phone: '9123456780',
    },
    {
        id: FRIEND_ABHINAV_ID,
        name: 'Abhinav',
        email: 'abhinav.singh@example.com',
        phone: '9988776655',
    },
    {
        id: FRIEND_KHEM_ID,
        name: 'Khem',
        email: 'khem.chandra@example.com',
        phone: '9871234560',
    },
];

const seedGroups: Group[] = [
    {
        id: DAARU_PARTY_GROUP_ID,
        name: 'Daaru Party',
        memberIds: seedUsers.map((user) => user.id),
        createdAt: '2026-07-01T00:00:00.000Z',
    },
];

const seedExpenses: Expense[] = [
    {
        id: 'expense-daaru',
        groupId: DAARU_PARTY_GROUP_ID,
        description: 'Daaru',
        amount: 5200,
        paidByUserId: FRIEND_DIVANSHU_ID,
        splitType: 'equal',
        splits: [
            { userId: CURRENT_USER_ID, amount: 1040 },
            { userId: FRIEND_ABHAY_ID, amount: 1040 },
            { userId: FRIEND_DIVANSHU_ID, amount: 1040 },
            { userId: FRIEND_ABHINAV_ID, amount: 1040 },
            { userId: FRIEND_KHEM_ID, amount: 1040 },
        ],
        createdAt: '2026-07-01T12:00:00.000Z',
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
