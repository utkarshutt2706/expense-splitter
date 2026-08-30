import type { User } from '@features/users/api/usersApi';
import { httpClient } from '@lib/api/httpClient';
import type { FriendContract } from '@lib/api/contracts';

export type Friend = User &
    Partial<Pick<FriendContract, 'sharedGroupCount' | 'netBalance' | 'groupBalances'>>;

export async function getFriends(): Promise<Friend[]> {
    const { data } = await httpClient.get<FriendContract[]>('/users/me/friends');
    return data;
}
