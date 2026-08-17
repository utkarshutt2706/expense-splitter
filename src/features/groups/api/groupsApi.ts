import type { Group } from '@data/entities';
import { httpClient } from '@lib/api/httpClient';

export interface CreateGroupInput {
    name: string;
    memberIds: string[];
}

export interface GroupSummary extends Group {
    memberCount: number;
    currentUserBalance: number;
    hasFinancialActivity: boolean;
    lastActivityAt: string | null;
}

export type UpdateGroupInput = Partial<Omit<Group, 'id' | 'createdAt'>>;

export async function getAll(): Promise<Group[]> {
    const { data } = await httpClient.get<Group[]>('/groups');
    return data;
}

export async function getAllSummaries(): Promise<GroupSummary[]> {
    const { data } = await httpClient.get<GroupSummary[]>('/groups/summaries');
    return data;
}

export async function getById(id: string): Promise<Group> {
    const { data } = await httpClient.get<Group>(`/groups/${id}`);
    return data;
}

export async function create(input: CreateGroupInput): Promise<Group> {
    const { data } = await httpClient.post<Group>('/groups', input);
    return data;
}

export async function update(id: string, changes: UpdateGroupInput): Promise<Group> {
    const { data } = await httpClient.patch<Group>(`/groups/${id}`, changes);
    return data;
}

export async function remove(id: string): Promise<void> {
    await httpClient.delete(`/groups/${id}`);
}
