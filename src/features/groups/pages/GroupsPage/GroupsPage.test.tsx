import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useFriends } from '@features/friends';
import { useCreateGroup, useGroupSummaries } from '@features/groups';
import { GroupsPage } from './GroupsPage';

vi.mock('@features/friends', () => ({
    useFriends: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: {
        loading: vi.fn(() => 'toast-id'),
        success: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('@features/groups', () => ({
    useGroupSummaries: vi.fn(),
    useCreateGroup: vi.fn(),
    CreateGroupDialog: ({
        open,
        onSubmit,
    }: {
        open: boolean;
        onSubmit: (values: { name: string; memberIds: string[] }) => void;
    }) =>
        open ? (
            <button
                type="button"
                onClick={() => onSubmit({ name: 'Weekend Trip', memberIds: ['friend-1'] })}
            >
                Fake create group submit
            </button>
        ) : null,
}));

const groups = [
    {
        id: 'group-1',
        name: 'Weekend Trip',
        memberIds: ['current-user', 'friend-1', 'friend-2'],
        memberCount: 3,
        currentUserBalance: 1250,
        hasFinancialActivity: true,
        lastActivityAt: '2026-08-15T00:00:00.000Z',
        createdAt: '',
    },
    {
        id: 'group-2',
        name: 'Roommates',
        memberIds: ['current-user'],
        memberCount: 1,
        currentUserBalance: -500,
        hasFinancialActivity: true,
        lastActivityAt: '2026-08-12T00:00:00.000Z',
        createdAt: '',
    },
];

function renderPage() {
    return render(
        <MemoryRouter>
            <GroupsPage />
        </MemoryRouter>,
    );
}

describe('GroupsPage', () => {
    beforeEach(() => {
        vi.mocked(useFriends).mockReturnValue({
            data: [],
        } as unknown as ReturnType<typeof useFriends>);
        vi.mocked(useCreateGroup).mockReturnValue({
            mutate: vi.fn(),
        } as unknown as ReturnType<typeof useCreateGroup>);
    });

    it('shows a loading message while fetching', () => {
        vi.mocked(useGroupSummaries).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useGroupSummaries>);

        renderPage();

        expect(screen.getByRole('status', { name: /loading groups/i })).toBeInTheDocument();
    });

    it('does not render the search box or create group trigger while fetching', () => {
        vi.mocked(useGroupSummaries).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useGroupSummaries>);

        renderPage();

        expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /create group/i })).not.toBeInTheDocument();
    });

    it('shows an error message when the query fails', () => {
        vi.mocked(useGroupSummaries).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        } as unknown as ReturnType<typeof useGroupSummaries>);

        renderPage();

        expect(screen.getByText(/we couldn’t load your groups/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('shows an empty state when there are no groups', () => {
        vi.mocked(useGroupSummaries).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupSummaries>);

        renderPage();

        expect(screen.getByText(/no groups yet/i)).toBeInTheDocument();
    });

    it('hides the search box but still shows the create group trigger when there are no groups', () => {
        vi.mocked(useGroupSummaries).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupSummaries>);

        renderPage();

        expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create group/i })).toBeInTheDocument();
    });

    it('renders each group with its name, pluralized member count, and a link to its detail page', () => {
        vi.mocked(useGroupSummaries).mockReturnValue({
            data: groups,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupSummaries>);

        renderPage();

        expect(screen.getByText('Weekend Trip')).toBeInTheDocument();
        expect(screen.getByText('3 members')).toBeInTheDocument();
        expect(screen.getByText('Roommates')).toBeInTheDocument();
        expect(screen.getByText('1 member')).toBeInTheDocument();
        expect(screen.getAllByText(/you are owed ₹1,250\.00/i)).not.toHaveLength(0);
        expect(screen.getAllByText(/you owe ₹500\.00/i)).not.toHaveLength(0);
        expect(screen.getByText(/last activity 15 aug 2026/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /weekend trip/i })).toHaveAttribute(
            'href',
            '/groups/group-1',
        );
        expect(screen.getByRole('link', { name: /roommates/i })).toHaveAttribute(
            'href',
            '/groups/group-2',
        );
    });

    it('sorts active groups by latest activity and places inactive groups last', () => {
        vi.mocked(useGroupSummaries).mockReturnValue({
            data: [
                {
                    ...groups[0],
                    id: 'inactive',
                    name: 'Alpha inactive',
                    currentUserBalance: 0,
                    hasFinancialActivity: false,
                    lastActivityAt: null,
                },
                groups[1],
                groups[0],
            ],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupSummaries>);

        renderPage();

        expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
            '/groups/group-1',
            '/groups/group-2',
            '/groups/inactive',
        ]);
        expect(screen.getByText('No expenses yet')).toBeInTheDocument();
        expect(screen.getAllByText('No balance')).not.toHaveLength(0);
    });

    it('shows a refreshing indicator during a background refetch, not the loading skeleton', () => {
        vi.mocked(useGroupSummaries).mockReturnValue({
            data: groups,
            isLoading: false,
            isFetching: true,
            isError: false,
        } as unknown as ReturnType<typeof useGroupSummaries>);

        renderPage();

        expect(screen.getByRole('status', { name: 'Refreshing…' })).toBeInTheDocument();
        expect(screen.queryByRole('status', { name: /loading groups/i })).not.toBeInTheDocument();
    });

    it('does not show a refreshing indicator once the background refetch settles', () => {
        vi.mocked(useGroupSummaries).mockReturnValue({
            data: groups,
            isLoading: false,
            isFetching: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroupSummaries>);

        renderPage();

        expect(screen.queryByRole('status', { name: 'Refreshing…' })).not.toBeInTheDocument();
    });

    describe('create group flow', () => {
        beforeEach(() => {
            vi.mocked(useGroupSummaries).mockReturnValue({
                data: [],
                isLoading: false,
                isError: false,
            } as unknown as ReturnType<typeof useGroupSummaries>);
        });

        it('opens the create dialog when the trigger is clicked', () => {
            renderPage();

            expect(screen.queryByText(/fake create group submit/i)).not.toBeInTheDocument();

            fireEvent.click(screen.getByRole('button', { name: /create group/i }));

            expect(screen.getByText(/fake create group submit/i)).toBeInTheDocument();
        });

        it('shows a loading toast immediately, then updates it to success', () => {
            let onSuccess: (() => void) | undefined;
            vi.mocked(useCreateGroup).mockReturnValue({
                mutate: vi.fn((_values, options: { onSuccess?: () => void }) => {
                    onSuccess = options.onSuccess;
                }),
            } as unknown as ReturnType<typeof useCreateGroup>);

            renderPage();

            fireEvent.click(screen.getByRole('button', { name: /create group/i }));
            fireEvent.click(screen.getByText(/fake create group submit/i));

            expect(toast.loading).toHaveBeenCalledWith('Group is being created…');

            onSuccess?.();

            expect(toast.success).toHaveBeenCalledWith('Group created', { id: 'toast-id' });
        });

        it('updates the loading toast to an error toast with the error message when it fails', () => {
            let onError: ((error: Error) => void) | undefined;
            vi.mocked(useCreateGroup).mockReturnValue({
                mutate: vi.fn((_values, options: { onError?: (error: Error) => void }) => {
                    onError = options.onError;
                }),
            } as unknown as ReturnType<typeof useCreateGroup>);

            renderPage();

            fireEvent.click(screen.getByRole('button', { name: /create group/i }));
            fireEvent.click(screen.getByText(/fake create group submit/i));
            onError?.(new Error('Something went wrong'));

            expect(toast.error).toHaveBeenCalledWith('Something went wrong', { id: 'toast-id' });
        });
    });

    describe('search', () => {
        beforeEach(() => {
            vi.mocked(useGroupSummaries).mockReturnValue({
                data: groups,
                isLoading: false,
                isError: false,
            } as unknown as ReturnType<typeof useGroupSummaries>);
            vi.mocked(useFriends).mockReturnValue({
                data: [
                    { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' },
                    { id: 'friend-2', name: 'Jordan Lee', phone: '5551234567' },
                ],
            } as unknown as ReturnType<typeof useFriends>);
        });

        it('filters groups by group name', () => {
            renderPage();

            fireEvent.change(screen.getByRole('searchbox', { name: /search groups/i }), {
                target: { value: 'weekend' },
            });

            expect(screen.getByText('Weekend Trip')).toBeInTheDocument();
            expect(screen.queryByText('Roommates')).not.toBeInTheDocument();
        });

        it('filters groups by member name', () => {
            renderPage();

            fireEvent.change(screen.getByRole('searchbox', { name: /search groups/i }), {
                target: { value: 'priya' },
            });

            expect(screen.getByText('Weekend Trip')).toBeInTheDocument();
            expect(screen.queryByText('Roommates')).not.toBeInTheDocument();
        });

        it('is case-insensitive', () => {
            renderPage();

            fireEvent.change(screen.getByRole('searchbox', { name: /search groups/i }), {
                target: { value: 'PRIYA' },
            });

            expect(screen.getByText('Weekend Trip')).toBeInTheDocument();
        });

        it('shows a no-match message when nothing matches the search', () => {
            renderPage();

            fireEvent.change(screen.getByRole('searchbox', { name: /search groups/i }), {
                target: { value: 'nobody' },
            });

            expect(screen.getByText(/no groups found/i)).toBeInTheDocument();
            expect(screen.getByText(/try a different search/i)).toBeInTheDocument();
            expect(screen.queryByText('Weekend Trip')).not.toBeInTheDocument();
            expect(screen.queryByText('Roommates')).not.toBeInTheDocument();
        });

        it('shows every group again once the search is cleared', () => {
            renderPage();

            const searchBox = screen.getByRole('searchbox', { name: /search groups/i });
            fireEvent.change(searchBox, { target: { value: 'priya' } });
            fireEvent.change(searchBox, { target: { value: '' } });

            expect(screen.getByText('Weekend Trip')).toBeInTheDocument();
            expect(screen.getByText('Roommates')).toBeInTheDocument();
        });
    });
});
