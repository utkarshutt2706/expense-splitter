import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ActionButtonSkeleton } from './ActionButtonSkeleton';

describe('ActionButtonSkeleton', () => {
    it('renders a placeholder block', () => {
        const { container } = render(<ActionButtonSkeleton className="w-32" />);

        expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
        expect(container.firstChild).toHaveClass('h-9', 'shrink-0', 'w-32');
    });
});
