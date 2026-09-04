import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Metric } from './Metric';

describe('Metric', () => {
    it('renders its label, formatted value, and explanatory help', () => {
        render(<Metric label="Paid by you" value={1234.5} help="Settlements excluded." />);
        expect(screen.getByText('Paid by you')).toBeInTheDocument();
        expect(screen.getByText('₹1,234.50')).toBeInTheDocument();
        expect(screen.getByText('Settlements excluded.')).toBeInTheDocument();
    });
});
