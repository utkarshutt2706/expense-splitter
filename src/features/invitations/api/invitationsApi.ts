import { httpClient } from '@lib/api/httpClient';

export interface InvitationValidation {
    email: string;
    group: { id: string; name: string };
    inviterName: string;
}

// Public -- called when the register page loads with ?invite=<token>, to show
// which group/email the invite is for before the person registers.
export async function validate(token: string): Promise<InvitationValidation> {
    const { data } = await httpClient.get<InvitationValidation>(`/invitations/${token}`);
    return data;
}
