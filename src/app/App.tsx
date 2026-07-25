import { Outlet } from 'react-router';
import { useThemeAttribute } from './useThemeAttribute';

export function App() {
    useThemeAttribute();

    return <Outlet />;
}
