import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useThemeTransitionStore } from '@app/stores';
import { ThemeTransitionOverlay } from './ThemeTransitionOverlay';

describe('ThemeTransitionOverlay', () => {
    beforeEach(() => {
        useThemeTransitionStore.setState({ direction: null });
    });

    it('renders nothing when no transition is in progress', () => {
        const { container } = render(<ThemeTransitionOverlay />);

        expect(container).toBeEmptyDOMElement();
    });

    it('renders a moon overlay when transitioning to dark', () => {
        useThemeTransitionStore.setState({ direction: 'dark' });

        const { container } = render(<ThemeTransitionOverlay />);

        expect(container.querySelector('.lucide-moon')).toBeInTheDocument();
        expect(container.querySelector('.lucide-sun')).not.toBeInTheDocument();
    });

    it('renders a sun overlay when transitioning to light', () => {
        useThemeTransitionStore.setState({ direction: 'light' });

        const { container } = render(<ThemeTransitionOverlay />);

        expect(container.querySelector('.lucide-sun')).toBeInTheDocument();
        expect(container.querySelector('.lucide-moon')).not.toBeInTheDocument();
    });

    it('clears the transition once the backdrop animation ends', () => {
        useThemeTransitionStore.setState({ direction: 'dark' });

        const { container } = render(<ThemeTransitionOverlay />);

        fireEvent.animationEnd(container.firstChild as Element);

        expect(useThemeTransitionStore.getState().direction).toBeNull();
    });

    it('does not clear when the child icon animation ends', () => {
        useThemeTransitionStore.setState({ direction: 'dark' });
        const { container } = render(<ThemeTransitionOverlay />);

        fireEvent.animationEnd(container.querySelector('.lucide-moon')!);

        expect(useThemeTransitionStore.getState().direction).toBe('dark');
    });

    it('is not interactive, sitting purely as a decorative overlay', () => {
        useThemeTransitionStore.setState({ direction: 'dark' });

        const { container } = render(<ThemeTransitionOverlay />);

        expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
        expect(container.firstChild).toHaveClass('pointer-events-none');
    });
});
