import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SplitTypeTabs } from './SplitTypeTabs';

describe('SplitTypeTabs', () => {
    it('renders a button for every split type', () => {
        render(<SplitTypeTabs value="equal" onChange={vi.fn()} />);

        expect(screen.getByRole('button', { name: 'Equal' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Exact' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Percentage' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Shares' })).toBeInTheDocument();
    });

    it('marks the active split type as pressed', () => {
        render(<SplitTypeTabs value="percentage" onChange={vi.fn()} />);

        expect(screen.getByRole('button', { name: 'Percentage' })).toHaveAttribute(
            'aria-pressed',
            'true',
        );
        expect(screen.getByRole('button', { name: 'Equal' })).toHaveAttribute(
            'aria-pressed',
            'false',
        );
    });

    it('calls onChange with the clicked split type', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        render(<SplitTypeTabs value="equal" onChange={onChange} />);

        await user.click(screen.getByRole('button', { name: 'Shares' }));

        expect(onChange).toHaveBeenCalledWith('shares');
    });
});
