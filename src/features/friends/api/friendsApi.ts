import type { User } from '@data/entities';
import { httpClient } from '@lib/api/httpClient';

export interface CreateFriendInput {
    name: string;
    email?: string;
    phone?: string;
}

export type UpdateFriendInput = Partial<Omit<User, 'id'>>;

export async function getAll(): Promise<User[]> {
    const { data } = await httpClient.get<User[]>('/users');
    return data;
}

export async function create(input: CreateFriendInput): Promise<User> {
    const { data } = await httpClient.post<User>('/users', input);
    return data;
}

export async function update(id: string, changes: UpdateFriendInput): Promise<User> {
    const { data } = await httpClient.patch<User>(`/users/${id}`, changes);
    return data;
}

export async function remove(id: string): Promise<void> {
    await httpClient.delete(`/users/${id}`);
}
