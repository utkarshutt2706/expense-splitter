import { Outlet } from 'react-router';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useThemeAttribute } from './useThemeAttribute';

export function App() {
    useThemeAttribute();

    return (
        <div className="flex min-h-svh bg-surface text-surface-foreground">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-y-auto">
                <Header />
                <main className="flex-1">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
