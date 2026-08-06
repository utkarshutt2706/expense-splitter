import { describe, expect, it, vi } from 'vitest';

import { httpClient } from '@lib/api/httpClient';
import { validate } from './invitationsApi';

vi.mock('@lib/api/httpClient', () => ({
    httpClient: {
        get: vi.fn(),
    },
}));

describe('invitationsApi', () => {
    it('validate gets /invitations/:token and returns the invited email and group', async () => {
        const validation = {
            email: 'jamie@example.com',
            group: { id: 'group-1', name: 'Goa Trip' },
            inviterName: 'Alice',
        };
        vi.mocked(httpClient.get).mockResolvedValue({ data: validation });

        const result = await validate('raw-token');

        expect(httpClient.get).toHaveBeenCalledWith('/invitations/raw-token');
        expect(result).toEqual(validation);
    });
});
