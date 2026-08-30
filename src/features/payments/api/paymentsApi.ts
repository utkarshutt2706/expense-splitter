import { httpClient } from '@lib/api/httpClient';
import type {
    CreatePaymentContract,
    PaymentContract,
    UpdatePaymentContract,
} from '@lib/api/contracts';

export type CreatePaymentInput = CreatePaymentContract;
export type UpdatePaymentInput = UpdatePaymentContract;
export type Payment = Omit<PaymentContract, 'paidOn'> & Partial<Pick<PaymentContract, 'paidOn'>>;

export async function getByGroupId(groupId: string): Promise<Payment[]> {
    const { data } = await httpClient.get<PaymentContract[]>(`/groups/${groupId}/payments`);
    return data;
}

export async function create(groupId: string, input: CreatePaymentInput): Promise<Payment> {
    const { data } = await httpClient.post<PaymentContract>(`/groups/${groupId}/payments`, input);
    return data;
}

export async function update(
    groupId: string,
    id: string,
    input: UpdatePaymentInput,
): Promise<Payment> {
    const { data } = await httpClient.patch<PaymentContract>(
        `/groups/${groupId}/payments/${id}`,
        input,
    );
    return data;
}

export async function remove(groupId: string, id: string): Promise<void> {
    await httpClient.delete(`/groups/${groupId}/payments/${id}`);
}
