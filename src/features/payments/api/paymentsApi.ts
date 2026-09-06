import { httpClient } from '@lib/api/httpClient';
import type {
    CreatePaymentContract,
    PaymentContract,
    UpdatePaymentContract,
} from '@lib/api/contracts';

export type CreatePaymentInput = Omit<CreatePaymentContract, 'timeZone'>;
export type UpdatePaymentInput = Omit<UpdatePaymentContract, 'timeZone'>;
export type Payment = Omit<PaymentContract, 'paidOn'> & Partial<Pick<PaymentContract, 'paidOn'>>;

export async function getByGroupId(groupId: string): Promise<Payment[]> {
    const { data } = await httpClient.get<PaymentContract[]>(`/groups/${groupId}/payments`);
    return data;
}

export async function create(groupId: string, input: CreatePaymentInput): Promise<Payment> {
    const { data } = await httpClient.post<PaymentContract>(`/groups/${groupId}/payments`, {
        ...input,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    } satisfies CreatePaymentContract);
    return data;
}

export async function update(
    groupId: string,
    id: string,
    input: UpdatePaymentInput,
): Promise<Payment> {
    const { data } = await httpClient.patch<PaymentContract>(`/groups/${groupId}/payments/${id}`, {
        ...input,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    } satisfies UpdatePaymentContract);
    return data;
}

export async function remove(groupId: string, id: string): Promise<void> {
    await httpClient.delete(`/groups/${groupId}/payments/${id}`);
}
