import { Outlet } from 'react-router';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { useThemeAttribute } from '../hooks/useThemeAttribute';

export function AppLayout() {
    useThemeAttribute();

    return (
        <div className="flex h-svh bg-surface text-surface-foreground">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden pl-16 md:pl-0">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
