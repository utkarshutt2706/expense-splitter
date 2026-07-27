import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
    it('renders with the given placeholder and accessible name', () => {
        render(
            <SearchInput
                value=""
                onChange={vi.fn()}
                placeholder="Search friends…"
                ariaLabel="Search friends"
            />,
        );

        const input = screen.getByRole('searchbox', { name: /search friends/i });
        expect(input).toHaveAttribute('placeholder', 'Search friends…');
    });

    it('calls onChange with the typed value', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        render(
            <SearchInput
                value=""
                onChange={onChange}
                placeholder="Search friends…"
                ariaLabel="Search friends"
            />,
        );

        await user.type(screen.getByRole('searchbox', { name: /search friends/i }), 'a');

        expect(onChange).toHaveBeenCalledWith('a');
    });

    it('reflects the given value', () => {
        render(
            <SearchInput
                value="priya"
                onChange={vi.fn()}
                placeholder="Search friends…"
                ariaLabel="Search friends"
            />,
        );

        expect(screen.getByRole('searchbox', { name: /search friends/i })).toHaveValue('priya');
    });
});
