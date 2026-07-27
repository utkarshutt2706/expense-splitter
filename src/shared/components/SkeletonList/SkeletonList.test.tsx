import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SkeletonList } from './SkeletonList';

describe('SkeletonList', () => {
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
});
