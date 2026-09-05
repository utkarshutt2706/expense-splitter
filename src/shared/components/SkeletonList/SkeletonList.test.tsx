import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SkeletonList } from './SkeletonList';

describe('SkeletonList', () => {
    afterEach(() => vi.restoreAllMocks());

    it('announces the loading label to assistive tech', () => {
        render(<SkeletonList label="Loading friends…" />);

        expect(screen.getByRole('status', { name: 'Loading friends…' })).toBeInTheDocument();
    });

    it('renders the requested number of placeholder rows', () => {
        render(<SkeletonList label="Loading friends…" count={3} />);

        expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });

    it('defaults to six placeholder rows', () => {
        render(<SkeletonList label="Loading friends…" />);

        expect(screen.getAllByRole('listitem')).toHaveLength(6);
    });

    it('renders an empty list when no placeholder rows are requested', () => {
        render(<SkeletonList label="Nothing loading" count={0} />);

        expect(screen.getByRole('status', { name: 'Nothing loading' })).toBeInTheDocument();
        expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    });

    it('keeps row keys stable until the requested count changes', () => {
        const randomUUID = vi.spyOn(crypto, 'randomUUID');
        const { rerender } = render(<SkeletonList label="Loading" count={2} />);
        expect(randomUUID).toHaveBeenCalledTimes(2);

        rerender(<SkeletonList label="Still loading" count={2} />);
        expect(randomUUID).toHaveBeenCalledTimes(2);

        rerender(<SkeletonList label="Loading more" count={3} />);
        expect(randomUUID).toHaveBeenCalledTimes(5);
    });
});
