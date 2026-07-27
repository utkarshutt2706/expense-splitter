import { useQuery } from '@tanstack/react-query';

import type { User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { userService } from '@services/instances';

const CACHE_KEY = 'current-user';

function readCachedCurrentUser(): User | undefined {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return undefined;

    try {
        return JSON.parse(raw) as User;
    } catch {
        return undefined;
    }
}

export function useCurrentUser() {
    return useQuery({
        queryKey: ['users', CURRENT_USER_ID],
        queryFn: async () => {
            const user = await userService.getById(CURRENT_USER_ID);
            localStorage.setItem(CACHE_KEY, JSON.stringify(user));
            return user;
        },
        initialData: readCachedCurrentUser,
    });
}
