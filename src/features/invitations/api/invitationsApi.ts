import type { Invitation } from '@data/entities';
import { httpClient } from '@lib/api/httpClient';

// Only for emails that aren't registered yet -- idempotent, calling again for
// the same email while a pending invite exists just returns that invitation.
export async function create(groupId: string, email: string): Promise<Invitation> {
    const { data } = await httpClient.post<Invitation>(`/groups/${groupId}/invitations`, {
        email,
    });
    return data;
}
