import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { useThemeAttribute } from './useThemeAttribute';

export function App() {
    useThemeAttribute();

    return (
        <div className="flex min-h-svh bg-surface text-surface-foreground">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
}
