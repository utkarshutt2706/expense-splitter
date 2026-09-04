import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BalanceDisclosure } from './BalanceDisclosure';

describe('BalanceDisclosure', () => {
    it('renders its summary and toggles collapsible content', () => {
        render(
            <BalanceDisclosure value="owed" label="You are owed" description="Two payments">
                <p>Details</p>
            </BalanceDisclosure>,
        );
        const trigger = screen.getByRole('button', { name: /You are owed.*Two payments/ });
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('Details')).toBeVisible();
    });

    it('omits an absent description', () => {
        render(
            <BalanceDisclosure value="owed" label="You are owed">
                <p>Details</p>
            </BalanceDisclosure>,
        );
        expect(screen.getByRole('button')).toHaveAccessibleName('You are owed');
    });
});
