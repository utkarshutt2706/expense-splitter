import { httpClient } from '@lib/api/httpClient';
import type {
    CreateGroupContract,
    GroupContract,
    GroupSummaryContract,
    UpdateGroupContract,
} from '@lib/api/contracts';

export type CreateGroupInput = CreateGroupContract;
export type Group = GroupContract;
export type GroupSummary = GroupSummaryContract;
export type UpdateGroupInput = UpdateGroupContract;

export async function getAll(): Promise<Group[]> {
    const { data } = await httpClient.get<GroupContract[]>('/groups');
    return data;
}

export async function getAllSummaries(): Promise<GroupSummary[]> {
    const { data } = await httpClient.get<GroupSummaryContract[]>('/groups/summaries');
    return data;
}

export async function getById(id: string): Promise<Group> {
    const { data } = await httpClient.get<GroupContract>(`/groups/${id}`);
    return data;
}

export async function create(input: CreateGroupInput): Promise<Group> {
    const { data } = await httpClient.post<GroupContract>('/groups', input);
    return data;
}

export async function update(id: string, changes: UpdateGroupInput): Promise<Group> {
    const { data } = await httpClient.patch<GroupContract>(`/groups/${id}`, changes);
    return data;
}

export async function remove(id: string): Promise<void> {
    await httpClient.delete(`/groups/${id}`);
}
