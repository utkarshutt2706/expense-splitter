import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TopProgressBar } from './TopProgressBar';

describe('TopProgressBar', () => {
    it('renders an accessible progress indicator', () => {
        render(<TopProgressBar />);

        expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();
    });
});
