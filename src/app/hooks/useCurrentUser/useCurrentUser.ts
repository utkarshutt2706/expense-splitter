import { useAuthStore } from '@app/stores';

// The current user's full record is fetched once, at login time (see LoginPage),
// and cached in authStore — this just reads it back synchronously, rather than
// re-querying the service/IndexedDB on every mount (which was showing a blank
// avatar in the sidebar for a moment after login).
export function useCurrentUser() {
    const cachedUser = useAuthStore((state) => state.cachedUser);
    return { data: cachedUser ?? undefined };
}
