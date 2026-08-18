import { Navigate, Outlet } from 'react-router';

import { useCurrentUser, useThemeAttribute } from '@app/hooks';
import { useAuthStore } from '@app/stores';
import { Header, Sidebar, ThemeTransitionOverlay } from '@app/components';
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
            <div className="flex flex-1 flex-col overflow-hidden pl-16 md:pl-0">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <Outlet />
                </main>
            </div>
            <ThemeTransitionOverlay />
        </div>
    );
}
