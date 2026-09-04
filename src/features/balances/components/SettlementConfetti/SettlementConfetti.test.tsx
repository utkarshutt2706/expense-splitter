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
});
