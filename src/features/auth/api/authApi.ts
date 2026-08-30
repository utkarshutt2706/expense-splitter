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
    phone: string;
}

export interface ChangePasswordInput {
    currentPassword: string;
    newPassword: string;
}

const sessionRequestConfig = {
    headers: { 'X-Session-Request': 'ExpenseSplitter' },
};

export async function login(input: LoginInput): Promise<AuthSession> {
    const { data } = await httpClient.post<AuthSession>('/auth/login', input);
    return data;
}

export async function register(input: RegisterInput): Promise<AuthSession> {
    const { data } = await httpClient.post<AuthSession>('/auth/register', input);
    return data;
}

export async function refreshSession(): Promise<AuthSession | null> {
    const { data } = await httpClient.post<AuthSession | null>(
        '/auth/refresh',
        undefined,
        sessionRequestConfig,
    );
    return data;
}

export async function logout(): Promise<void> {
    await httpClient.post('/auth/logout', undefined, sessionRequestConfig);
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
    await httpClient.patch('/auth/password', input);
}
