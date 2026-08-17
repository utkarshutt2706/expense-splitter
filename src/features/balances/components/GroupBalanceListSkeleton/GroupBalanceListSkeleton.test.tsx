import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { GroupBalanceListSkeleton } from './GroupBalanceListSkeleton';

describe('GroupBalanceListSkeleton', () => {
    it('preserves the user-first section hierarchy without showing financial values', () => {
        const { container } = render(<GroupBalanceListSkeleton />);

        expect(container.querySelectorAll('.animate-pulse')).toHaveLength(8);
        expect(screen.queryByText(/₹|settled|owe/i)).not.toBeInTheDocument();
    });
});
