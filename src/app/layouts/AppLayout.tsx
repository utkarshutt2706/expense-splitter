import { Outlet } from 'react-router';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { useThemeAttribute } from '../hooks/useThemeAttribute';

export function AppLayout() {
    useThemeAttribute();

    return (
        <div className="flex min-h-svh bg-surface text-surface-foreground">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-y-auto pl-16 md:pl-0">
                <Header />
                <main className="p-4 md:p-6 flex-1">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
