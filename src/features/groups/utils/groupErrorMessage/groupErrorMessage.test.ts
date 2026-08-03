import { describe, expect, it } from 'vitest';

import { ApiError } from '@lib/api/apiError';
import { groupErrorMessage } from './groupErrorMessage';

describe('groupErrorMessage', () => {
    it('returns an access-denied message for a FORBIDDEN ApiError', () => {
        expect(groupErrorMessage(new ApiError('FORBIDDEN', 'You are not a member', 403))).toBe(
            "You don't have access to this group.",
        );
    });

    it('returns a generic message for a NOT_FOUND ApiError', () => {
        expect(groupErrorMessage(new ApiError('NOT_FOUND', 'Group not found', 404))).toBe(
            "Couldn't load this group.",
        );
    });

    it('returns a generic message for a non-ApiError error', () => {
        expect(groupErrorMessage(new Error('network down'))).toBe("Couldn't load this group.");
    });

    it('returns a generic message when there is no error', () => {
        expect(groupErrorMessage(undefined)).toBe("Couldn't load this group.");
    });
});
