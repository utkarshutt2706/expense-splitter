import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { useUserLookup } from '@features/users/hooks';
import { ApiError } from '@lib/api/apiError';
import { MemberSearchSection } from './MemberSearchSection';

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

const priya: User = { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' };
const jordan: User = { id: 'friend-2', name: 'Jordan Lee', phone: '5551234567' };
const users: User[] = [priya, jordan];

function noop() {}

describe('MemberSearchSection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLookup();
    });

    it('renders the search box and the given users', () => {
        render(
            <MemberSearchSection
                search=""
                onSearchChange={noop}
                visibleUsers={users}
                selectedIds={[]}
                onToggle={noop}
                pendingInvites={[]}
                onFound={noop}
                onInvite={noop}
                onRemoveInvite={noop}
            />,
        );

        expect(screen.getByRole('searchbox', { name: /search members/i })).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: /priya sharma/i })).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: /jordan lee/i })).toBeInTheDocument();
    });

    it('reports search text changes', () => {
        const onSearchChange = vi.fn();
        render(
            <MemberSearchSection
                search=""
                onSearchChange={onSearchChange}
                visibleUsers={users}
                selectedIds={[]}
                onToggle={noop}
                pendingInvites={[]}
                onFound={noop}
                onInvite={noop}
                onRemoveInvite={noop}
            />,
        );

        fireEvent.change(screen.getByRole('searchbox', { name: /search members/i }), {
            target: { value: 'priya' },
        });

        expect(onSearchChange).toHaveBeenCalledWith('priya');
    });

    it('reports a toggle when a member checkbox is clicked', () => {
        const onToggle = vi.fn();
        render(
            <MemberSearchSection
                search=""
                onSearchChange={noop}
                visibleUsers={users}
                selectedIds={[]}
                onToggle={onToggle}
                pendingInvites={[]}
                onFound={noop}
                onInvite={noop}
                onRemoveInvite={noop}
            />,
        );

        fireEvent.click(screen.getByRole('checkbox', { name: /priya sharma/i }));

        expect(onToggle).toHaveBeenCalledWith('friend-1');
    });

    it('renders pending invite chips and reports removal', () => {
        const onRemoveInvite = vi.fn();
        render(
            <MemberSearchSection
                search=""
                onSearchChange={noop}
                visibleUsers={users}
                selectedIds={[]}
                onToggle={noop}
                pendingInvites={['sam@example.com']}
                onFound={noop}
                onInvite={noop}
                onRemoveInvite={onRemoveInvite}
            />,
        );

        expect(screen.getByText('sam@example.com')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /remove invite/i }));

        expect(onRemoveInvite).toHaveBeenCalledWith('sam@example.com');
    });

    it('passes currentUserId/lockCurrentUser through to the member checklist', () => {
        render(
            <MemberSearchSection
                search=""
                onSearchChange={noop}
                visibleUsers={users}
                selectedIds={['friend-1']}
                onToggle={noop}
                pendingInvites={[]}
                onFound={noop}
                onInvite={noop}
                onRemoveInvite={noop}
                currentUserId="friend-1"
                lockCurrentUser
            />,
        );

        expect(screen.queryByText('Priya Sharma')).not.toBeInTheDocument();
        const currentUserCheckbox = screen.getByRole('checkbox', { name: 'You' });
        expect(currentUserCheckbox).toBeChecked();
        expect(currentUserCheckbox).toBeDisabled();
    });

    it('surfaces a found non-friend from the search panel', () => {
        const jamie: User = { id: 'user-9', name: 'Jamie Fox', email: 'jamie@example.com' };
        mockLookup({ data: jamie });
        vi.useFakeTimers();

        const onFound = vi.fn();
        render(
            <MemberSearchSection
                search="jamie@example.com"
                onSearchChange={noop}
                visibleUsers={[]}
                selectedIds={[]}
                onToggle={noop}
                pendingInvites={[]}
                onFound={onFound}
                onInvite={noop}
                onRemoveInvite={noop}
            />,
        );
        act(() => {
            vi.advanceTimersByTime(400);
        });

        expect(screen.getByText(/jamie fox/i)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /add/i }));

        vi.useRealTimers();
        expect(onFound).toHaveBeenCalledWith(jamie);
    });

    it('surfaces an invite prompt for an unregistered email', () => {
        mockLookup({
            isError: true,
            error: new ApiError('NOT_FOUND', 'No registered user matches', 404),
        });
        vi.useFakeTimers();

        const onInvite = vi.fn();
        render(
            <MemberSearchSection
                search="sam@example.com"
                onSearchChange={noop}
                visibleUsers={[]}
                selectedIds={[]}
                onToggle={noop}
                pendingInvites={[]}
                onFound={noop}
                onInvite={onInvite}
                onRemoveInvite={noop}
            />,
        );
        act(() => {
            vi.advanceTimersByTime(400);
        });

        expect(screen.getByText(/isn't registered with us yet/i)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /invite them/i }));

        vi.useRealTimers();
        expect(onInvite).toHaveBeenCalledWith('sam@example.com');
    });
});
