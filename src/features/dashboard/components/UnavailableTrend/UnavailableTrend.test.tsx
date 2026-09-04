import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UnavailableTrend } from './UnavailableTrend';

describe('UnavailableTrend', () => {
    it('explains why daily trend data is unavailable', () => {
        render(<UnavailableTrend />);
        expect(
            screen.getByRole('heading', { name: 'Daily trend unavailable' }),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Refresh after the dashboard server has been updated.'),
        ).toBeInTheDocument();
    });
});
