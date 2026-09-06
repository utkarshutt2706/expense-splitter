import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SettlementConfetti } from './SettlementConfetti';

describe('SettlementConfetti', () => {
    beforeEach(() => {
        sessionStorage.clear();
        vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList);
    });
    afterEach(() => vi.restoreAllMocks());

    it.each([
        ['personal', 12],
        ['group', 18],
    ] as const)('renders and records a one-time %s celebration', (celebration, count) => {
        const view = render(<SettlementConfetti groupId="group-1" celebration={celebration} />);
        const confetti = screen.getByTestId(`${celebration}-settlement-confetti`);
        expect(confetti.children).toHaveLength(count);
        expect(
            sessionStorage.getItem(`expense-splitter:settlement-celebrated:group-1:${celebration}`),
        ).toBe('true');
        fireEvent.animationEnd(confetti);
        expect(screen.queryByTestId(`${celebration}-settlement-confetti`)).not.toBeInTheDocument();
        view.unmount();
        render(<SettlementConfetti groupId="group-1" celebration={celebration} />);
        expect(screen.queryByTestId(`${celebration}-settlement-confetti`)).not.toBeInTheDocument();
    });

    it('does not celebrate when reduced motion is requested', () => {
        vi.mocked(window.matchMedia).mockReturnValue({ matches: true } as MediaQueryList);
        render(<SettlementConfetti groupId="group-1" celebration="group" />);
        expect(screen.queryByTestId('group-settlement-confetti')).not.toBeInTheDocument();
    });

    it('still celebrates when session storage is unavailable', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new DOMException('Storage blocked');
        });

        render(<SettlementConfetti groupId="private" celebration="personal" />);

        expect(screen.getByTestId('personal-settlement-confetti')).toBeInTheDocument();
    });

    it('uses deterministic visual properties while cycling the color palette', () => {
        render(<SettlementConfetti groupId="styled" celebration="personal" />);

        const particles = screen.getByTestId('personal-settlement-confetti').children;
        expect(particles[0]).toHaveStyle({
            '--confetti-color': '#c2410c',
            '--confetti-delay': '0ms',
            '--confetti-left': '8%',
            '--confetti-rotation': '90deg',
        });
        expect(particles[5]).toHaveStyle({ '--confetti-color': '#c2410c' });
        expect(particles[6]).toHaveStyle({ '--confetti-delay': '0ms' });
    });
});
