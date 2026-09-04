import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SingleBalancePosition } from './SingleBalancePosition';

describe('SingleBalancePosition', () => {
    it.each([
        ['receive', 1, 'payment', 'text-owed'],
        ['pay', 2, 'payments', 'text-owe'],
    ] as const)(
        'renders a %s position with pluralized payment count',
        (tone, count, noun, className) => {
            render(
                <SingleBalancePosition
                    text="₹50.00"
                    count={count}
                    suffix="remaining"
                    tone={tone}
                />,
            );
            expect(screen.getByText('₹50.00')).toHaveClass(className);
            expect(screen.getByText(`${count} ${noun} remaining`)).toBeInTheDocument();
        },
    );
});
