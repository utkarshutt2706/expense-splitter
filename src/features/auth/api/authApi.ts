import type { User } from '@data/entities';
import { httpClient } from '@lib/api/httpClient';

export interface AuthSession {
    user: User;
    accessToken: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface RegisterInput {
    name: string;
    email: string;
    password: string;
    phone?: string;
    inviteToken?: string;
}

export async function login(input: LoginInput): Promise<AuthSession> {
    const { data } = await httpClient.post<AuthSession>('/auth/login', input);
    return data;
}

export async function register(input: RegisterInput): Promise<AuthSession> {
    const { data } = await httpClient.post<AuthSession>('/auth/register', input);
    return data;
}
