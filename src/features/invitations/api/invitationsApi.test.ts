import { describe, expect, it, vi } from 'vitest';

import type { Invitation } from '@data/entities';
import { httpClient } from '@lib/api/httpClient';
import { create } from './invitationsApi';

vi.mock('@lib/api/httpClient', () => ({
    httpClient: {
        post: vi.fn(),
    },
}));

const invitation: Invitation = {
    id: 'invitation-1',
    groupId: 'group-1',
    email: 'jamie@example.com',
    status: 'pending',
    expiresAt: '2026-08-13T00:00:00.000Z',
};

describe('invitationsApi', () => {
    it('create posts an email to /groups/:groupId/invitations', async () => {
        vi.mocked(httpClient.post).mockResolvedValue({ data: invitation });

        const result = await create('group-1', 'jamie@example.com');

        expect(httpClient.post).toHaveBeenCalledWith('/groups/group-1/invitations', {
            email: 'jamie@example.com',
        });
        expect(result).toEqual(invitation);
    });
});
