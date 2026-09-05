import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { NotFoundPage } from './NotFoundPage';

describe('NotFoundPage', () => {
    it('shows a "page not found" heading', () => {
        render(
            <MemoryRouter>
                <NotFoundPage />
            </MemoryRouter>,
        );

        expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
    });

    it('explains the missing page and links back to groups', () => {
        render(
            <MemoryRouter>
                <NotFoundPage />
            </MemoryRouter>,
        );

        expect(screen.getByRole('link', { name: /back to groups/i })).toHaveAttribute(
            'href',
            '/groups',
        );
        expect(screen.getByText(/doesn't exist or may have moved/i)).toBeInTheDocument();
    });
});
