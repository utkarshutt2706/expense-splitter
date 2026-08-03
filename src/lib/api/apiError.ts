import type { AxiosError } from 'axios';

export type ApiErrorCode =
    | 'VALIDATION_ERROR'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'ERROR'
    | 'INTERNAL_ERROR';

interface ApiErrorBody {
    error: {
        code: ApiErrorCode;
        message: string;
    };
}

export class ApiError extends Error {
    readonly code: ApiErrorCode;
    readonly status: number | undefined;

    constructor(code: ApiErrorCode, message: string, status: number | undefined) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.status = status;
    }
}

function isApiErrorBody(data: unknown): data is ApiErrorBody {
    return (
        typeof data === 'object' &&
        data !== null &&
        'error' in data &&
        typeof (data as ApiErrorBody).error === 'object'
    );
}

export function toApiError(error: AxiosError): ApiError {
    const response = error.response;
    if (response && isApiErrorBody(response.data)) {
        const { code, message } = response.data.error;
        return new ApiError(code, message, response.status);
    }
    return new ApiError('ERROR', error.message, response?.status);
}
