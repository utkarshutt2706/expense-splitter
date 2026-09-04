import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { NoSpendingState } from './NoSpendingState';

describe('NoSpendingState', () => {
    it('renders description and a complete optional action', () => {
        render(
            <MemoryRouter>
                <NoSpendingState
                    description="Try another period."
                    link="/groups/one"
                    linkLabel="Open group"
                />
            </MemoryRouter>,
        );
        expect(
            screen.getByRole('heading', { name: 'No spending in this period' }),
        ).toBeInTheDocument();
        expect(screen.getByText('Try another period.')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Open group' })).toHaveAttribute(
            'href',
            '/groups/one',
        );
    });

    it.each([{ link: '/groups/one' }, { linkLabel: 'Open group' }, {}])(
        'omits an incomplete optional action',
        (props) => {
            render(
                <MemoryRouter>
                    <NoSpendingState description="Empty" {...props} />
                </MemoryRouter>,
            );
            expect(screen.queryByRole('link')).not.toBeInTheDocument();
        },
    );
});
