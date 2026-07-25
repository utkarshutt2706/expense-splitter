import { useEffect } from 'react';
import { useThemeStore } from '../stores/themeStore';

export function useThemeAttribute() {
    const theme = useThemeStore((state) => state.theme);

    useEffect(() => {
        if (theme === 'system') {
            delete document.documentElement.dataset.theme;
        } else {
            document.documentElement.dataset.theme = theme;
        }
    }, [theme]);
}
