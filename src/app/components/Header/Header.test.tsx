import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { Header } from './Header';

describe('Header', () => {
    it('shows the title matching the current route', () => {
        render(
            <MemoryRouter initialEntries={['/friends']}>
                <Header />
            </MemoryRouter>,
        );

        expect(screen.getByRole('heading', { name: 'Friends' })).toBeInTheDocument();
    });
});
