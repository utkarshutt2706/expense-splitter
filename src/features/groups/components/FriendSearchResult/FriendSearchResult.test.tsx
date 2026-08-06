import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { useUserLookup } from '@features/users/hooks';
import { ApiError } from '@lib/api/apiError';
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

    it('renders nothing when there are already local matches', () => {
        mockLookup();
        render(
            <FriendSearchResult
                search="jamie@example.com"
                hasLocalMatches
                pendingInvites={[]}
                onFound={vi.fn()}
                onInvite={vi.fn()}
            />,
        );
        advanceDebounce();

        expect(useUserLookup).toHaveBeenLastCalledWith(null);
        expect(screen.queryByText(/jamie/i)).not.toBeInTheDocument();
    });

    it('renders nothing while the search text is not a complete email or phone', () => {
        mockLookup();
        render(
            <FriendSearchResult
                search="jam"
                hasLocalMatches={false}
                pendingInvites={[]}
                onFound={vi.fn()}
                onInvite={vi.fn()}
            />,
        );
        advanceDebounce();

        expect(useUserLookup).toHaveBeenLastCalledWith(null);
    });

    it('looks up by email only once the debounce settles', () => {
        mockLookup();
        const { rerender } = render(
            <FriendSearchResult
                search=""
                hasLocalMatches={false}
                pendingInvites={[]}
                onFound={vi.fn()}
                onInvite={vi.fn()}
            />,
        );

        rerender(
            <FriendSearchResult
                search="jamie@example.com"
                hasLocalMatches={false}
                pendingInvites={[]}
                onFound={vi.fn()}
                onInvite={vi.fn()}
            />,
        );

        expect(useUserLookup).toHaveBeenLastCalledWith(null);

        advanceDebounce();

        expect(useUserLookup).toHaveBeenLastCalledWith({ email: 'jamie@example.com' });
    });

    it('looks up by phone for a complete 10-digit number', () => {
        mockLookup();
        render(
            <FriendSearchResult
                search="9876543210"
                hasLocalMatches={false}
                pendingInvites={[]}
                onFound={vi.fn()}
                onInvite={vi.fn()}
            />,
        );
        advanceDebounce();

        expect(useUserLookup).toHaveBeenLastCalledWith({ phone: '9876543210' });
    });

    it('skips the lookup when the email is already queued as a pending invite', () => {
        mockLookup();
        render(
            <FriendSearchResult
                search="jamie@example.com"
                hasLocalMatches={false}
                pendingInvites={['jamie@example.com']}
                onFound={vi.fn()}
                onInvite={vi.fn()}
            />,
        );
        advanceDebounce();

        expect(useUserLookup).toHaveBeenLastCalledWith(null);
    });

    it('shows a loading indicator while searching', () => {
        mockLookup({ isFetching: true });
        render(
            <FriendSearchResult
                search="jamie@example.com"
                hasLocalMatches={false}
                pendingInvites={[]}
                onFound={vi.fn()}
                onInvite={vi.fn()}
            />,
        );
        advanceDebounce();

        expect(screen.getByText(/searching/i)).toBeInTheDocument();
    });

    it('shows the found user and adds them on click', () => {
        mockLookup({ data: jamie });
        const onFound = vi.fn();
        render(
            <FriendSearchResult
                search="jamie@example.com"
                hasLocalMatches={false}
                pendingInvites={[]}
                onFound={onFound}
                onInvite={vi.fn()}
            />,
        );
        advanceDebounce();

        expect(screen.getByText(/jamie fox/i)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /add/i }));

        expect(onFound).toHaveBeenCalledWith(jamie);
    });

    it('offers to invite an unregistered email', () => {
        mockLookup({
            isError: true,
            error: new ApiError('NOT_FOUND', 'No registered user matches', 404),
        });
        const onInvite = vi.fn();
        render(
            <FriendSearchResult
                search="jamie@example.com"
                hasLocalMatches={false}
                pendingInvites={[]}
                onFound={vi.fn()}
                onInvite={onInvite}
            />,
        );
        advanceDebounce();

        expect(screen.getByText(/isn't registered with us yet/i)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /invite them/i }));

        expect(onInvite).toHaveBeenCalledWith('jamie@example.com');
    });

    it('suggests searching by email when a phone number is not found', () => {
        mockLookup({
            isError: true,
            error: new ApiError('NOT_FOUND', 'No registered user matches', 404),
        });
        render(
            <FriendSearchResult
                search="9876543210"
                hasLocalMatches={false}
                pendingInvites={[]}
                onFound={vi.fn()}
                onInvite={vi.fn()}
            />,
        );
        advanceDebounce();

        expect(screen.getByText(/try searching by their email instead/i)).toBeInTheDocument();
    });

    it('shows a generic error for a non-NOT_FOUND failure', () => {
        mockLookup({
            isError: true,
            error: new ApiError('ERROR', 'Network error', undefined),
        });
        render(
            <FriendSearchResult
                search="jamie@example.com"
                hasLocalMatches={false}
                pendingInvites={[]}
                onFound={vi.fn()}
                onInvite={vi.fn()}
            />,
        );
        advanceDebounce();

        expect(screen.getByText(/couldn't search right now/i)).toBeInTheDocument();
    });
});
