import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

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
        expect(container.firstChild).toHaveClass('border-red-600', 'cursor-not-allowed');
    });

    it.each([true, 'true'] as const)('styles aria-invalid=%s as invalid', (ariaInvalid) => {
        const { container } = render(
            <CurrencyInput aria-label="Amount" aria-invalid={ariaInvalid} />,
        );

        expect(container.firstChild).toHaveClass('border-red-600');
    });

    it('does not style an explicitly valid input as invalid', () => {
        const { container } = render(<CurrencyInput aria-label="Amount" aria-invalid="false" />);

        expect(container.firstChild).not.toHaveClass('border-red-600');
    });

    it('forwards its ref, input props, and change events', async () => {
        const ref = createRef<HTMLInputElement>();
        const onChange = vi.fn();
        const user = userEvent.setup();
        render(
            <CurrencyInput
                ref={ref}
                aria-label="Amount"
                name="amount"
                min="0"
                step="0.01"
                onChange={onChange}
            />,
        );

        await user.type(screen.getByRole('spinbutton', { name: 'Amount' }), '12.5');

        expect(ref.current).toBe(screen.getByRole('spinbutton', { name: 'Amount' }));
        expect(ref.current).toHaveAttribute('name', 'amount');
        expect(ref.current).toHaveAttribute('step', '0.01');
        expect(onChange).toHaveBeenCalled();
    });

    it('applies read-only and custom input and container styling independently', () => {
        const { container } = render(
            <CurrencyInput
                aria-label="Amount"
                readOnly
                className="text-right"
                containerClassName="max-w-xs"
            />,
        );

        expect(container.firstChild).toHaveClass('bg-muted/40', 'max-w-xs');
        expect(screen.getByRole('spinbutton', { name: 'Amount' })).toHaveClass('text-right');
        expect(screen.getByRole('spinbutton', { name: 'Amount' })).toHaveAttribute(
            'inputmode',
            'decimal',
        );
    });
});
