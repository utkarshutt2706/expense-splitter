import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InjuredServerIllustration } from './InjuredServerIllustration';

describe('InjuredServerIllustration', () => {
    it('exposes one descriptive image while hiding decorative details', () => {
        const { container } = render(<InjuredServerIllustration />);

        expect(
            screen.getByRole('img', { name: 'An injured server waiting to recover' }),
        ).toBeInTheDocument();
        expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
        expect(container.querySelector('span')).toHaveAttribute('aria-hidden', 'true');
    });
});
