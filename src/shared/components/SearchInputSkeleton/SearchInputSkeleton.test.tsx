import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SearchInputSkeleton } from './SearchInputSkeleton';

describe('SearchInputSkeleton', () => {
    it('renders a placeholder block', () => {
        const { container } = render(<SearchInputSkeleton />);

        expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    });
});
