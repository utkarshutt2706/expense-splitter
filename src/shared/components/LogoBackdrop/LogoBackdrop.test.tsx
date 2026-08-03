import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LogoBackdrop } from './LogoBackdrop';

describe('LogoBackdrop', () => {
    it('renders a scatter of decorative, non-interactive logo marks', () => {
        const { container } = render(<LogoBackdrop />);

        const root = container.firstChild as HTMLElement;
        expect(root).toHaveAttribute('aria-hidden', 'true');
        expect(root).toHaveClass('pointer-events-none');

        const marks = container.querySelectorAll('img');
        expect(marks.length).toBeGreaterThan(1);
        for (const mark of marks) {
            expect(mark).toHaveAttribute('alt', '');
        }
    });
});
