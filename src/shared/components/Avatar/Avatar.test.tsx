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

    it('renders at the default medium size', () => {
        render(<Avatar name="Alex Morgan" />);

        expect(screen.getByText('AM')).toHaveClass('size-9');
    });

    it('renders at the small size when requested', () => {
        render(<Avatar name="Alex Morgan" size="sm" />);

        expect(screen.getByText('AM')).toHaveClass('size-6');
    });

    it('renders the fallback icon at the small size when requested', () => {
        const { container } = render(<Avatar name="" size="sm" />);

        expect(container.querySelector('svg')).toHaveClass('size-6');
    });

    it('never shrinks below its size in a flex row, even next to long sibling content', () => {
        render(<Avatar name="Alex Morgan" />);

        expect(screen.getByText('AM')).toHaveClass('shrink-0');
    });

    it('applies the same shrink protection to the fallback icon', () => {
        const { container } = render(<Avatar name="" />);

        expect(container.querySelector('svg')).toHaveClass('shrink-0');
    });
});
