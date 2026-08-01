import { Suspense } from 'react';
import { Navigate, Outlet } from 'react-router';

import { Header, Sidebar } from '@app/components';
import { useThemeAttribute } from '@app/hooks';
import { useAuthStore } from '@app/stores';
import { TopProgressBar } from '@shared/components';

export function AppLayout() {
    useThemeAttribute();
    const currentUserId = useAuthStore((state) => state.currentUserId);

    if (!currentUserId) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="bg-surface text-surface-foreground flex h-svh">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden pl-16 md:pl-0">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <Suspense fallback={<TopProgressBar />}>
                        <Outlet />
                    </Suspense>
                </main>
            </div>
        </div>
    );
}
