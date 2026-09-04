import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { SpendingSummary } from './SpendingSummary';

vi.mock('@features/dashboard/components/Metric', () => ({
    Metric: ({ label, value, help }: { label: string; value: number; help: string }) => (
        <div data-testid="metric" data-value={value} data-help={help}>
            {label}
        </div>
    ),
}));

describe('SpendingSummary', () => {
    it('renders overall contribution metrics and analytics navigation', () => {
        render(
            <MemoryRouter>
                <SpendingSummary paid={120} share={80} periodLabel="This month" />
            </MemoryRouter>,
        );
        expect(
            screen.getByRole('heading', { name: 'Shared-spending summary' }),
        ).toBeInTheDocument();
        expect(screen.getByText('This month')).toBeInTheDocument();
        expect(
            screen.getAllByTestId('metric').map((node) => [node.textContent, node.dataset.value]),
        ).toEqual([
            ['Paid by you', '120'],
            ['Your share', '80'],
        ]);
        expect(screen.getByText(/paid ₹40.00 more than your share/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'View analytics' })).toHaveAttribute(
            'href',
            '/analytics',
        );
    });

    it('includes total group spending for a selected group summary', () => {
        render(
            <MemoryRouter>
                <SpendingSummary paid={20} share={20} total={75} periodLabel="Overall" />
            </MemoryRouter>,
        );
        expect(screen.getAllByTestId('metric').map((node) => node.textContent)).toEqual([
            'Total group spending',
            'Paid by you',
            'Your share',
        ]);
        expect(screen.getByText(/matches your share/i)).toBeInTheDocument();
    });
});
