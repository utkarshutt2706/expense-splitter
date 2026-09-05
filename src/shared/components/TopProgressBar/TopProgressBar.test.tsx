import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TopProgressBar } from './TopProgressBar';

describe('TopProgressBar', () => {
    it('renders an accessible progress indicator', () => {
        const { container } = render(<TopProgressBar />);

        const progress = screen.getByRole('progressbar', { name: 'Loading' });
        expect(progress).not.toHaveAttribute('value');
        expect(progress).toHaveClass('sr-only');
        expect(container.querySelector('[aria-hidden="true"]')).toHaveClass(
            'animate-progress-fill',
        );
    });
});
