import type { User } from '@data/entities';
import { httpClient } from '@lib/api/httpClient';

export type LookupQuery = { query: string };

export async function getByIds(ids: string[]): Promise<User[]> {
    const { data } = await httpClient.post<User[]>('/users/batch', { ids });
    return data;
}

export async function lookup(query: LookupQuery): Promise<User[]> {
    const { data } = await httpClient.get<User[]>('/users/lookup', { params: query });
    return data;
}

export async function updateUser(id: string, input: Partial<Pick<User, 'phone'>>): Promise<User> {
    const { data } = await httpClient.patch<User>(`/users/${id}`, input);
    return data;
}
