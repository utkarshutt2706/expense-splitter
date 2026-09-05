import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FetchingIndicator } from './FetchingIndicator';

describe('FetchingIndicator', () => {
    it('renders with a default accessible label', () => {
        render(<FetchingIndicator />);

        expect(screen.getByRole('status', { name: 'Refreshing…' })).toBeInTheDocument();
    });

    it('accepts a custom label', () => {
        render(<FetchingIndicator label="Updating balances…" className="size-6" />);

        expect(screen.getByRole('status', { name: 'Updating balances…' })).toHaveClass(
            'size-6',
            'animate-spin',
        );
    });
});
