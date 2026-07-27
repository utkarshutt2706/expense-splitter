import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppProviders } from './AppProviders';

describe('AppProviders', () => {
    it('renders its children', () => {
        render(
            <AppProviders>
                <p>child content</p>
            </AppProviders>,
        );

        expect(screen.getByText('child content')).toBeInTheDocument();
    });
});
