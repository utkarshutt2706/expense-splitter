import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DashboardSkeleton } from './DashboardSkeleton';

describe('DashboardSkeleton', () => {
    it('announces loading without rendering financial zeroes', () => {
        render(<DashboardSkeleton />);

        expect(screen.getByRole('status', { name: /loading dashboard/i })).toBeInTheDocument();
        expect(screen.queryByText(/₹0/)).not.toBeInTheDocument();
    });
});
