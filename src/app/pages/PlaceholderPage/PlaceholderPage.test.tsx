import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PlaceholderPage } from './PlaceholderPage';

describe('PlaceholderPage', () => {
    it('renders the given title', () => {
        render(<PlaceholderPage title="Friends coming soon" />);

        expect(screen.getByText('Friends coming soon')).toBeInTheDocument();
    });

    it('renders arbitrary title text without interpreting markup', () => {
        render(<PlaceholderPage title={'Coming soon <script>alert("x")</script>'} />);

        expect(screen.getByText('Coming soon <script>alert("x")</script>')).toBeInTheDocument();
        expect(document.querySelector('script')).not.toBeInTheDocument();
    });
});
