import type { User } from '@features/users/api/usersApi';
import { httpClient } from '@lib/api/httpClient';
import type {
    AuthSessionContract,
    ChangePasswordContract,
    LoginContract,
    RegisterContract,
} from '@lib/api/contracts';

export type AuthSession = Omit<AuthSessionContract, 'user'> & { user: User };
export type LoginInput = LoginContract;
export type RegisterInput = RegisterContract;
export type ChangePasswordInput = ChangePasswordContract;

const sessionRequestConfig = {
    headers: { 'X-Session-Request': 'ExpenseSplitter' },
};

export async function login(input: LoginInput): Promise<AuthSession> {
    const { data } = await httpClient.post<AuthSessionContract>('/auth/login', input);
    return data;
}

export async function register(input: RegisterInput): Promise<AuthSession> {
    const { data } = await httpClient.post<AuthSessionContract>('/auth/register', input);
    return data;
}

export async function refreshSession(): Promise<AuthSession | null> {
    const { data } = await httpClient.post<AuthSessionContract | null>(
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
