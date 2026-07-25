import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar } from './Avatar';

describe('Avatar', () => {
    it('renders initials for a real name', () => {
        render(<Avatar name="Alex Morgan" />);

        expect(screen.getByText('AM')).toBeInTheDocument();
    });

    it('renders a fallback icon when the name is empty', () => {
        const { container } = render(<Avatar name="" />);

        expect(container.querySelector('svg')).toBeInTheDocument();
    });
});
