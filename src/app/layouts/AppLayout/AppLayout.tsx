import { Suspense } from 'react';
import { Outlet } from 'react-router';

import { Header, Sidebar } from '@app/components';
import { useThemeAttribute } from '@app/hooks';
import { TopProgressBar } from '@shared/components';

export function AppLayout() {
    useThemeAttribute();

    return (
        <div className="flex h-svh bg-surface text-surface-foreground">
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
