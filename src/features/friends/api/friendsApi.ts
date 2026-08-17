import type { User } from '@data/entities';
import { httpClient } from '@lib/api/httpClient';

export interface Friend extends User {
    sharedGroupCount?: number;
    netBalance?: number;
    groupBalances?: Array<{ groupId: string; groupName: string; balance: number }>;
}

export async function getFriends(): Promise<Friend[]> {
    const { data } = await httpClient.get<Friend[]>('/users/me/friends');
    return data;
}
