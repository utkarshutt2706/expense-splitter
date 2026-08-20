import { Navigate, Outlet } from 'react-router';

import { useCurrentUser, useThemeAttribute } from '@app/hooks';
import { useAuthStore } from '@app/stores';
import { BottomNav, Header, Sidebar, ThemeTransitionOverlay } from '@app/components';
import { PhoneRequiredGate } from './PhoneRequiredGate';

export function AppLayout() {
    useThemeAttribute();
    const currentUserId = useAuthStore((state) => state.currentUserId);
    const { data: currentUser } = useCurrentUser();

    if (!currentUserId) {
        return <Navigate to="/login" replace />;
    }

    if (currentUser && !currentUser.phone) {
        return <PhoneRequiredGate currentUserId={currentUser.id} />;
    }

    return (
        <div className="bg-surface text-surface-foreground flex h-svh">
            <Sidebar />
            {/* md: the sidebar is a fixed 4rem rail, so the content is inset past
                it. lg: it becomes a static flex sibling and claims its own width.
                Below md there is no sidebar at all — BottomNav replaces it. */}
            <div className="flex flex-1 flex-col overflow-hidden md:pl-16 lg:pl-0">
                <Header />
                {/* BottomNav is fixed, so reserve its height plus the iOS home
                    indicator inset at the end of the scroll area below md. */}
                <main className="pb-nav-clearance flex-1 overflow-y-auto p-4 md:p-6">
                    <Outlet />
                </main>
            </div>
            <BottomNav />
            <ThemeTransitionOverlay />
        </div>
    );
}
