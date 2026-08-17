import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CurrencyInput } from './CurrencyInput';

describe('CurrencyInput', () => {
    it('renders a non-editable visual prefix without changing the input value', () => {
        const { container } = render(
            <CurrencyInput aria-label="Amount" value="1414.00" readOnly />,
        );

        expect(screen.getByRole('spinbutton', { name: 'Amount' })).toHaveValue(1414);
        expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('₹');
        expect(container.querySelector('[aria-hidden="true"]')).toHaveClass('border-r');
    });

    it('keeps the prefix visible for empty, invalid, and disabled inputs', () => {
        const { container } = render(
            <CurrencyInput aria-label="Amount" aria-invalid="true" disabled />,
        );

        expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('₹');
        expect(screen.getByRole('spinbutton', { name: 'Amount' })).toBeDisabled();
    });
});
