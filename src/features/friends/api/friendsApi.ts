import type { User } from '@data/entities';
import { httpClient } from '@lib/api/httpClient';

export async function getFriends(): Promise<User[]> {
    const { data } = await httpClient.get<User[]>('/users/me/friends');
    return data;
}
