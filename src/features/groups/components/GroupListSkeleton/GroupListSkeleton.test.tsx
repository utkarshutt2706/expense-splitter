import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { GroupListSkeleton } from './GroupListSkeleton';

vi.mock('@shared/components/Skeleton', () => ({
    Skeleton: ({ className }: { className?: string }) => (
        <span data-testid="skeleton" className={className} />
    ),
}));

describe('GroupListSkeleton', () => {
    it('announces loading and renders three complete placeholder rows', () => {
        render(<GroupListSkeleton />);
        expect(screen.getByRole('status', { name: 'Loading groups…' })).toBeInTheDocument();
        expect(screen.getAllByTestId('skeleton')).toHaveLength(12);
    });
});
