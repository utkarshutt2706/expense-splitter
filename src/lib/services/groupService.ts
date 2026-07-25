import type { Group } from '../storage/models';
import type { IGroupRepository } from '../storage/repositories';
import { NotFoundError } from './errors';
import { simulateLatency } from './latency';

export class GroupService {
    private readonly repository: IGroupRepository;

    constructor(repository: IGroupRepository) {
        this.repository = repository;
    }

    async getById(id: string): Promise<Group> {
        const group = await simulateLatency(() => this.repository.getById(id));
        if (!group) {
            throw new NotFoundError('Group', id);
        }
        return group;
    }

    getAll(): Promise<Group[]> {
        return simulateLatency(() => this.repository.getAll());
    }

    create(group: Group): Promise<Group> {
        return simulateLatency(() => this.repository.create(group));
    }

    update(id: string, changes: Partial<Omit<Group, 'id'>>): Promise<Group> {
        return simulateLatency(() => this.repository.update(id, changes));
    }

    delete(id: string): Promise<void> {
        return simulateLatency(() => this.repository.delete(id));
    }
}
