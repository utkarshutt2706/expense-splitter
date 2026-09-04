import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useIsDarkTheme } from '@app/hooks';

import { ThemeToggleRow } from './ThemeToggleRow';

const { setThemeMock, triggerMock } = vi.hoisted(() => ({
    setThemeMock: vi.fn(),
    triggerMock: vi.fn(),
}));

vi.mock('@app/hooks', () => ({ useIsDarkTheme: vi.fn() }));
vi.mock('@app/stores', () => ({
    useThemeStore: (selector: (state: { setTheme: typeof setThemeMock }) => unknown) =>
        selector({ setTheme: setThemeMock }),
    useThemeTransitionStore: (selector: (state: { trigger: typeof triggerMock }) => unknown) =>
        selector({ trigger: triggerMock }),
}));

describe('ThemeToggleRow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it.each([
        [false, 'false', 'dark'],
        [true, 'true', 'light'],
    ] as const)(
        'reflects the current theme and switches to the opposite theme',
        (isDark, checked, next) => {
            vi.mocked(useIsDarkTheme).mockReturnValue(isDark);
            render(<ThemeToggleRow />);
            const toggle = screen.getByRole('switch', { name: 'Toggle dark theme' });

            expect(toggle).toHaveAttribute('aria-checked', checked);
            expect(screen.getByText('Theme')).toBeInTheDocument();
            fireEvent.click(toggle);

            expect(setThemeMock).toHaveBeenCalledWith(next);
            expect(triggerMock).toHaveBeenCalledWith(next);
        },
    );
});
