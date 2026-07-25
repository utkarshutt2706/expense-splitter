import type { User } from '../storage/models';
import type { IUserRepository } from '../storage/repositories';
import { NotFoundError } from './errors';
import { simulateLatency } from './latency';

export class UserService {
    private readonly repository: IUserRepository;

    constructor(repository: IUserRepository) {
        this.repository = repository;
    }

    async getById(id: string): Promise<User> {
        const user = await simulateLatency(() => this.repository.getById(id));
        if (!user) {
            throw new NotFoundError('User', id);
        }
        return user;
    }

    getAll(): Promise<User[]> {
        return simulateLatency(() => this.repository.getAll());
    }

    create(user: User): Promise<User> {
        return simulateLatency(() => this.repository.create(user));
    }

    update(id: string, changes: Partial<Omit<User, 'id'>>): Promise<User> {
        return simulateLatency(() => this.repository.update(id, changes));
    }

    delete(id: string): Promise<void> {
        return simulateLatency(() => this.repository.delete(id));
    }
}
