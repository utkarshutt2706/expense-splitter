import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BalancePositionValue } from './BalancePositionValue';

describe('BalancePositionValue', () => {
    it.each([
        ['receive', 'text-owed'],
        ['pay', 'text-owe'],
    ] as const)('formats a %s position with its semantic tone', (tone, className) => {
        render(<BalancePositionValue label="Total" amount={123.45} tone={tone} />);
        expect(screen.getByText('Total')).toBeInTheDocument();
        expect(screen.getByText('₹123.45')).toHaveClass(className);
    });
});
