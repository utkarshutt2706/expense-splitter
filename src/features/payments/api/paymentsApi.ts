import type { Payment } from '@data/entities';
import { httpClient } from '@lib/api/httpClient';

export interface CreatePaymentInput {
    fromUserId: string;
    toUserId: string;
    amount: number;
}

export async function getByGroupId(groupId: string): Promise<Payment[]> {
    const { data } = await httpClient.get<Payment[]>(`/groups/${groupId}/payments`);
    return data;
}

export async function create(groupId: string, input: CreatePaymentInput): Promise<Payment> {
    const { data } = await httpClient.post<Payment>(`/groups/${groupId}/payments`, input);
    return data;
}
