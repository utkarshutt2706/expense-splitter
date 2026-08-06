import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { useUserLookup } from '@features/users/hooks';
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
                onFound={noop}
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
                onFound={noop}
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
                onFound={noop}
            />,
        );

        fireEvent.click(screen.getByRole('checkbox', { name: /priya sharma/i }));

        expect(onToggle).toHaveBeenCalledWith('friend-1');
    });

    it('passes currentUserId/lockCurrentUser through to the member checklist', () => {
        render(
            <MemberSearchSection
                search=""
                onSearchChange={noop}
                visibleUsers={users}
                selectedIds={['friend-1']}
                onToggle={noop}
                onFound={noop}
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
                onFound={onFound}
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
});
