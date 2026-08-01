import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Payment } from '@data/entities';
import type { IPaymentRepository } from '@data/repositories';
import { PaymentService } from './paymentService';

vi.mock('./latency', () => ({
    simulateLatency: (operation: () => Promise<unknown>) => operation(),
}));

describe('PaymentService', () => {
    let repository: IPaymentRepository;
    let service: PaymentService;

    const payment: Payment = {
        id: 'payment-1',
        groupId: 'group-1',
        fromUserId: 'user-1',
        toUserId: 'user-2',
        amount: 25,
        createdAt: '2026-07-25T00:00:00.000Z',
    };

    beforeEach(() => {
        repository = {
            getByGroupId: vi.fn(),
            create: vi.fn(),
        };
        service = new PaymentService(repository);
    });

    it('delegates getByGroupId to the repository', async () => {
        vi.mocked(repository.getByGroupId).mockResolvedValue([payment]);

        await expect(service.getByGroupId('group-1')).resolves.toEqual([payment]);
    });

    it('delegates create to the repository', async () => {
        vi.mocked(repository.create).mockResolvedValue(payment);

        await expect(service.create(payment)).resolves.toEqual(payment);
        expect(repository.create).toHaveBeenCalledWith(payment);
    });
});
