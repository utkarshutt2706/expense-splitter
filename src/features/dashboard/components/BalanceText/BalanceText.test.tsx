import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BalanceText } from './BalanceText';

describe('BalanceText', () => {
    it.each([
        [25, false, 'You are owed ₹25.00', 'text-owed'],
        [25, true, 'Owed ₹25.00', 'text-owed'],
        [-20, false, 'You owe ₹20.00', 'text-owe'],
        [-20, true, 'Owe ₹20.00', 'text-owe'],
        [0, false, 'Settled up', 'text-muted-foreground'],
    ] as const)('renders value %s with short=%s', (value, short, text, className) => {
        render(<BalanceText value={value} short={short} />);
        expect(screen.getByText(text)).toHaveClass(className);
    });
});
