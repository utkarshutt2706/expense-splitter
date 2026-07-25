import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { Header } from './Header';

vi.mock('./useCurrentUser', () => ({
    useCurrentUser: () => ({ data: { id: 'current-user', name: 'Alex Morgan', email: '' } }),
}));

describe('Header', () => {
    it('shows the title matching the current route', () => {
        render(
            <MemoryRouter initialEntries={['/friends']}>
                <Header />
            </MemoryRouter>,
        );

        expect(screen.getByRole('heading', { name: 'Friends' })).toBeInTheDocument();
    });

    it('renders the user menu trigger', () => {
        render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>,
        );

        expect(screen.getByRole('button', { name: /open user menu/i })).toBeInTheDocument();
    });
});
