import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FriendsListSkeleton } from './FriendsListSkeleton';

vi.mock('@shared/components', () => ({ Skeleton: () => <span data-testid="skeleton" /> }));

describe('FriendsListSkeleton', () => {
    it('announces loading and renders four placeholder rows', () => {
        render(<FriendsListSkeleton />);
        expect(screen.getByRole('status', { name: 'Loading friends…' })).toBeInTheDocument();
        expect(screen.getAllByTestId('skeleton')).toHaveLength(16);
    });
});
