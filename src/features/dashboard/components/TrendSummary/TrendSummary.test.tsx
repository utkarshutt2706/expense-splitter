import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TrendSummary } from './TrendSummary';

describe('TrendSummary', () => {
    it('announces all values for the selected trend period', () => {
        const { container } = render(
            <TrendSummary
                selected={{
                    period: '2026-08',
                    label: 'Aug 26',
                    amount: 300,
                    currentUserShare: 125,
                    actualPaid: 175,
                }}
            />,
        );
        const summary = container.querySelector('dl');
        expect(summary).toHaveAttribute('aria-live', 'polite');
        expect(screen.getByText('Total group spending').nextElementSibling).toHaveTextContent(
            '₹300.00',
        );
        expect(screen.getByText('Your share').nextElementSibling).toHaveTextContent('₹125.00');
        expect(screen.getByText('Paid by you').nextElementSibling).toHaveTextContent('₹175.00');
    });
});
