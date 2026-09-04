import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ContributionBar } from './ContributionBar';

vi.mock('@features/dashboard/components/ProgressBar', () => ({
    ProgressBar: (props: object) => (
        <span data-testid="progress" data-props={JSON.stringify(props)} />
    ),
}));

describe('ContributionBar', () => {
    it.each([
        [25, 100, false, 25, 'amber'],
        [0.5, 100, true, 2, 'brand'],
        [0, 100, false, 0, 'amber'],
    ] as const)('renders value %s against scale %s', (value, scale, solid, percentage, variant) => {
        render(<ContributionBar label="Paid" value={value} scale={scale} solid={solid} />);
        expect(screen.getByText('Paid')).toBeInTheDocument();
        expect(
            screen.getByText(
                new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(
                    value,
                ),
            ),
        ).toBeInTheDocument();
        expect(JSON.parse(screen.getByTestId('progress').dataset.props!)).toEqual({
            percentage,
            variant,
        });
    });
});
