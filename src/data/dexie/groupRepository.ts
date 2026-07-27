import type { Group } from '../entities';
import type { IGroupRepository } from '../repositories';
import type { AppDatabase } from './database';

export class DexieGroupRepository implements IGroupRepository {
    private readonly db: AppDatabase;

    constructor(db: AppDatabase) {
        this.db = db;
    }

    getById(id: string) {
        return this.db.groups.get(id);
    }

    getAll() {
        return this.db.groups.toArray();
    }

    async create(group: Group) {
        await this.db.groups.add(group);
        return group;
    }

    async update(id: string, changes: Partial<Omit<Group, 'id'>>) {
        await this.db.groups.update(id, changes);
        const updated = await this.db.groups.get(id);
        if (!updated) {
            throw new Error(`Group ${id} not found`);
        }
        return updated;
    }

    async delete(id: string) {
        await this.db.groups.delete(id);
    }
}
