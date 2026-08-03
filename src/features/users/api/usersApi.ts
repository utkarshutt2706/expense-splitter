import type { User } from '@data/entities';
import { httpClient } from '@lib/api/httpClient';

export async function getByIds(ids: string[]): Promise<User[]> {
    const { data } = await httpClient.post<User[]>('/users/batch', { ids });
    return data;
}
