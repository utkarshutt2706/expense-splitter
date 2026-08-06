import type { User } from '@data/entities';
import { httpClient } from '@lib/api/httpClient';

export type LookupQuery = { email: string } | { phone: string };

export async function getByIds(ids: string[]): Promise<User[]> {
    const { data } = await httpClient.post<User[]>('/users/batch', { ids });
    return data;
}

// Throws ApiError with code NOT_FOUND when no registered user matches --
// callers use that to distinguish "not found" from a real request failure.
export async function lookup(query: LookupQuery): Promise<User> {
    const { data } = await httpClient.get<User>('/users/lookup', { params: query });
    return data;
}
