import type { User } from '../entities';
import type { IUserRepository } from '../repositories';
import type { AppDatabase } from './database';

export class DexieUserRepository implements IUserRepository {
    private readonly db: AppDatabase;

    constructor(db: AppDatabase) {
        this.db = db;
    }

    getById(id: string) {
        return this.db.users.get(id);
    }

    getAll() {
        return this.db.users.toArray();
    }

    async create(user: User) {
        await this.db.users.add(user);
        return user;
    }

    async update(id: string, changes: Partial<Omit<User, 'id'>>) {
        await this.db.users.update(id, changes);
        const updated = await this.db.users.get(id);
        if (!updated) {
            throw new Error(`User ${id} not found`);
        }
        return updated;
    }

    async delete(id: string) {
        await this.db.users.delete(id);
    }
}
