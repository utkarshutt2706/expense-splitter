import type { Expense, Group, User } from './models';

export interface IUserRepository {
    getById(id: string): Promise<User | undefined>;
    getAll(): Promise<User[]>;
    create(user: User): Promise<User>;
    update(id: string, changes: Partial<Omit<User, 'id'>>): Promise<User>;
    delete(id: string): Promise<void>;
}

export interface IGroupRepository {
    getById(id: string): Promise<Group | undefined>;
    getAll(): Promise<Group[]>;
    create(group: Group): Promise<Group>;
    update(id: string, changes: Partial<Omit<Group, 'id'>>): Promise<Group>;
    delete(id: string): Promise<void>;
}

export interface IExpenseRepository {
    getById(id: string): Promise<Expense | undefined>;
    getByGroupId(groupId: string): Promise<Expense[]>;
    create(expense: Expense): Promise<Expense>;
    update(id: string, changes: Partial<Omit<Expense, 'id'>>): Promise<Expense>;
    delete(id: string): Promise<void>;
}
