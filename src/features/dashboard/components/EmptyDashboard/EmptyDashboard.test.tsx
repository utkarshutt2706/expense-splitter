import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { EmptyDashboard } from './EmptyDashboard';

describe('EmptyDashboard', () => {
    it('explains the empty state and links to group creation', () => {
        render(
            <MemoryRouter>
                <EmptyDashboard />
            </MemoryRouter>,
        );

        expect(screen.getByRole('heading', { name: 'No shared spending yet' })).toBeInTheDocument();
        expect(screen.getByText(/record your first shared expense/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Create a group' })).toHaveAttribute(
            'href',
            '/groups',
        );
    });
});
