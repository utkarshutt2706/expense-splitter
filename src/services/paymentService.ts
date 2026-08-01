import type { Payment } from '@data/entities';
import type { IPaymentRepository } from '@data/repositories';
import { simulateLatency } from './latency';

export class PaymentService {
    private readonly repository: IPaymentRepository;

    constructor(repository: IPaymentRepository) {
        this.repository = repository;
    }

    getByGroupId(groupId: string): Promise<Payment[]> {
        return simulateLatency(() => this.repository.getByGroupId(groupId));
    }

    create(payment: Payment): Promise<Payment> {
        return simulateLatency(() => this.repository.create(payment));
    }
}
