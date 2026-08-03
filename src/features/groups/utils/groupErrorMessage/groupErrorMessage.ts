import { ApiError } from '@lib/api/apiError';

export function groupErrorMessage(error: unknown): string {
    if (error instanceof ApiError && error.code === 'FORBIDDEN') {
        return "You don't have access to this group.";
    }
    return "Couldn't load this group.";
}
