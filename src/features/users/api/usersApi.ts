import type { UpdateUserContract, UserContract } from '@lib/api/contracts';
import { httpClient } from '@lib/api/httpClient';

export type LookupQuery = { query: string };
export type User = Pick<UserContract, 'id' | 'name'> &
    Partial<Pick<UserContract, 'email' | 'phone' | 'avatarUrl'>>;

export async function getByIds(ids: string[]): Promise<User[]> {
    const { data } = await httpClient.post<UserContract[]>('/users/batch', { ids });
    return data;
}

export async function lookup(query: LookupQuery): Promise<User[]> {
    const { data } = await httpClient.get<UserContract[]>('/users/lookup', { params: query });
    return data;
}

export async function updateUser(id: string, input: UpdateUserContract): Promise<User> {
    const { data } = await httpClient.patch<UserContract>(`/users/${id}`, input);
    return data;
}
