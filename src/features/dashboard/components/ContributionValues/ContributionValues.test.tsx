import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { ContributionValues } from './ContributionValues';

describe('ContributionValues', () => {
    it('renders paid and share values as a definition list', () => {
        render(
            <ContributionValues
                group={{ actualPaid: 120, currentUserShare: 75 } as DashboardGroupSpend}
            />,
        );
        expect(screen.getByText('Paid by you').nextElementSibling).toHaveTextContent('₹120.00');
        expect(screen.getByText('Your share').nextElementSibling).toHaveTextContent('₹75.00');
    });
});
