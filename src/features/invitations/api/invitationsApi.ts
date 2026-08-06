import type { Invitation } from '@data/entities';
import { httpClient } from '@lib/api/httpClient';

export interface InvitationValidation {
    email: string;
    group: { id: string; name: string };
    inviterName: string;
}

// Only for emails that aren't registered yet -- idempotent, calling again for
// the same email while a pending invite exists just returns that invitation.
export async function create(groupId: string, email: string): Promise<Invitation> {
    const { data } = await httpClient.post<Invitation>(`/groups/${groupId}/invitations`, {
        email,
    });
    return data;
}

// Public -- called when the register page loads with ?invite=<token>, to show
// which group/email the invite is for before the person registers.
export async function validate(token: string): Promise<InvitationValidation> {
    const { data } = await httpClient.get<InvitationValidation>(`/invitations/${token}`);
    return data;
}
