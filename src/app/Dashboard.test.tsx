import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Dashboard } from './Dashboard';

describe('Dashboard', () => {
    it('renders the placeholder content', () => {
        render(<Dashboard />);

        expect(screen.getByText(/dashboard coming soon/i)).toBeInTheDocument();
    });
});
