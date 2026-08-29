import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { useUserLookup } from '@features/users/hooks';
import { FriendSearchResult } from './FriendSearchResult';

vi.mock('@features/users/hooks', () => ({
    useUserLookup: vi.fn(),
}));

function mockLookup(overrides: Record<string, unknown> = {}) {
    vi.mocked(useUserLookup).mockReturnValue({
        data: undefined,
        isFetching: false,
        isError: false,
        error: null,
        ...overrides,
    } as unknown as ReturnType<typeof useUserLookup>);
}

const jamie: User = { id: 'user-9', name: 'Jamie Fox', email: 'jamie@example.com' };

function advanceDebounce() {
    act(() => {
        vi.advanceTimersByTime(400);
    });
}

describe('FriendSearchResult', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('still triggers lookup when there are already local matches', () => {
        mockLookup();
        render(<FriendSearchResult search="jamie" onFound={vi.fn()} />);
        advanceDebounce();

        expect(useUserLookup).toHaveBeenLastCalledWith({ query: 'jamie' });
    });

    it('looks up using a generic query once the debounce settles', () => {
        mockLookup();
        const { rerender } = render(<FriendSearchResult search="" onFound={vi.fn()} />);

        rerender(<FriendSearchResult search="jamie" onFound={vi.fn()} />);

        expect(useUserLookup).toHaveBeenLastCalledWith(null);

        advanceDebounce();

        expect(useUserLookup).toHaveBeenLastCalledWith({ query: 'jamie' });
    });

    it('shows a loading indicator while searching', () => {
        mockLookup({ isFetching: true });
        render(<FriendSearchResult search="jamie" onFound={vi.fn()} />);
        advanceDebounce();

        expect(screen.getByText(/searching/i)).toBeInTheDocument();
    });

    it('shows the first found user and adds them on click', () => {
        mockLookup({ data: [jamie] });
        const onFound = vi.fn();
        render(<FriendSearchResult search="jamie" onFound={onFound} />);
        advanceDebounce();

        expect(screen.getByText(/^jamie$/i)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /add/i }));

        expect(onFound).toHaveBeenCalledWith(jamie);
    });

    it('shows a generic error for a non-NOT_FOUND failure', () => {
        mockLookup({
            isError: true,
            error: new Error('Network error'),
        });
        render(<FriendSearchResult search="jamie" onFound={vi.fn()} />);
        advanceDebounce();

        expect(screen.getByText(/couldn't search right now/i)).toBeInTheDocument();
    });
});
