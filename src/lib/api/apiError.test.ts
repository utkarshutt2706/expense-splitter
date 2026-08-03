import type { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';

import { ApiError, toApiError } from './apiError';

function axiosErrorWithResponse(status: number, body: unknown): AxiosError {
    return {
        name: 'AxiosError',
        message: 'Request failed',
        isAxiosError: true,
        toJSON: () => ({}),
        response: { status, data: body } as AxiosError['response'],
    } as AxiosError;
}

function axiosErrorWithoutResponse(message: string): AxiosError {
    return {
        name: 'AxiosError',
        message,
        isAxiosError: true,
        toJSON: () => ({}),
    } as AxiosError;
}

describe('toApiError', () => {
    it('parses the code, message, and status from a well-formed API error body', () => {
        const error = axiosErrorWithResponse(404, {
            error: { code: 'NOT_FOUND', message: 'User does-not-exist not found' },
        });

        const apiError = toApiError(error);

        expect(apiError).toBeInstanceOf(ApiError);
        expect(apiError.code).toBe('NOT_FOUND');
        expect(apiError.message).toBe('User does-not-exist not found');
        expect(apiError.status).toBe(404);
    });

    it('falls back to an ERROR code when the response body does not match the expected shape', () => {
        const error = axiosErrorWithResponse(500, { unexpected: true });

        const apiError = toApiError(error);

        expect(apiError.code).toBe('ERROR');
        expect(apiError.message).toBe('Request failed');
        expect(apiError.status).toBe(500);
    });

    it('falls back to an ERROR code with no status when there is no response at all', () => {
        const error = axiosErrorWithoutResponse('Network Error');

        const apiError = toApiError(error);

        expect(apiError.code).toBe('ERROR');
        expect(apiError.message).toBe('Network Error');
        expect(apiError.status).toBeUndefined();
    });
});
