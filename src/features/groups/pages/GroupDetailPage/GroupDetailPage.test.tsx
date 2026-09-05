import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Group } from '@features/groups/api/groupsApi';
import type { User } from '@features/users/api/usersApi';
import { useGroup, useGroupMembers } from '@features/groups';
import { ApiError } from '@lib/api/apiError';
import { GroupDetailPage } from './GroupDetailPage';

const routeState = vi.hoisted(() => ({ groupId: 'group-1' as string | undefined }));

vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return { ...actual, useParams: () => ({ groupId: routeState.groupId }) };
});

vi.mock('@features/groups', () => ({
    useGroup: vi.fn(),
    useGroupMembers: vi.fn(),
}));

vi.mock('@features/groups/components/GroupMembersSection', () => ({
    GroupMembersSection: ({
        members,
        isMembersLoading,
        isMembersFetching,
        isGroupFetching,
    }: {
        members: User[];
        isMembersLoading: boolean;
        isMembersFetching: boolean;
        isGroupFetching: boolean;
    }) => (
        <div data-testid="group-members-section">
            {`${members.length}-${String(isMembersLoading)}-${String(isMembersFetching)}-${String(isGroupFetching)}`}
        </div>
    ),
}));

vi.mock('@features/groups/components/MemberAvatarsSkeleton', () => ({
    MemberAvatarsSkeleton: () => <div data-testid="member-avatars-skeleton" />,
}));

vi.mock('@features/expenses', () => ({
    GroupActivityList: ({ groupId, members }: { groupId: string; members: User[] }) => (
        <div data-testid="group-activity-list">{`${groupId}-${members.length}`}</div>
    ),
    GroupBalanceSummary: ({ groupId }: { groupId: string }) => (
        <div data-testid="group-balance-summary">{groupId}</div>
    ),
    AddExpenseAction: ({ groupId, members }: { groupId: string; members: User[] }) => (
        <div data-testid="add-expense-action">{`${groupId}-${members.length}`}</div>
    ),
}));

const group: Group = {
    id: 'group-1',
    name: 'Weekend Trip',
    memberIds: ['current-user', 'friend-1'],
    createdAt: '',
};

const members: User[] = [
    { id: 'current-user', name: 'Alex Morgan', email: 'alex@example.com' },
    { id: 'friend-1', name: 'Priya Sharma', email: 'priya@example.com' },
];

function renderPage() {
    return render(
        <MemoryRouter>
            <GroupDetailPage />
        </MemoryRouter>,
    );
}

describe('GroupDetailPage', () => {
    beforeEach(() => {
        routeState.groupId = 'group-1';
        vi.clearAllMocks();
    });

    it('shows a loading message while fetching, with group-name content deferred but balance/expenses fetching in parallel', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
            isFetching: true,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: [],
            isLoading: false,
            isFetching: false,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByRole('status', { name: /loading group/i })).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Weekend Trip' })).not.toBeInTheDocument();
        expect(screen.queryByTestId('add-expense-action')).not.toBeInTheDocument();
        // Balance/expenses don't need the group query to resolve — groupId comes
        // straight from the route — so they mount and start fetching immediately
        // instead of waiting behind the group query, avoiding a skeleton waterfall.
        expect(screen.getByTestId('group-balance-summary')).toHaveTextContent('group-1');
        expect(screen.getByTestId('group-activity-list')).toHaveTextContent('group-1-0');
    });

    it('shows an error message when the group fails to load, without rendering balance/expenses', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: [],
            isLoading: false,
            isFetching: false,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByText(/couldn't load this group/i)).toBeInTheDocument();
        expect(screen.queryByTestId('group-balance-summary')).not.toBeInTheDocument();
        expect(screen.queryByTestId('group-activity-list')).not.toBeInTheDocument();
    });

    it('shows an access-denied message when the caller is not a member of the group', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
            error: new ApiError('FORBIDDEN', 'You are not a member of this group', 403),
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: [],
            isLoading: false,
            isFetching: false,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByText(/you don't have access to this group/i)).toBeInTheDocument();
    });

    it('shows the fallback error when a successful query has no group', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: undefined,
            isLoading: false,
            isFetching: false,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByText(/couldn't load this group/i)).toBeInTheDocument();
        expect(screen.getByTestId('group-balance-summary')).toHaveTextContent('group-1');
        expect(screen.queryByTestId('add-expense-action')).not.toBeInTheDocument();
    });

    it('uses empty identifiers and member lists when the route parameter is absent', () => {
        routeState.groupId = undefined;
        vi.mocked(useGroup).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: undefined,
            isLoading: true,
            isFetching: false,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(useGroup).toHaveBeenCalledWith('');
        expect(useGroupMembers).toHaveBeenCalledWith([]);
        expect(screen.getByTestId('group-balance-summary')).toHaveTextContent('');
        expect(screen.getByTestId('group-activity-list')).toHaveTextContent('-0');
    });

    it('renders the back link', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: [],
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByRole('link', { name: /back to groups/i })).toHaveAttribute(
            'href',
            '/groups',
        );
    });

    describe('once the group has loaded', () => {
        beforeEach(() => {
            vi.mocked(useGroup).mockReturnValue({
                data: group,
                isLoading: false,
                isError: false,
                isFetching: false,
            } as unknown as ReturnType<typeof useGroup>);
            vi.mocked(useGroupMembers).mockReturnValue({
                data: members,
                isLoading: false,
                isFetching: false,
            } as unknown as ReturnType<typeof useGroupMembers>);
        });

        it('renders the group name, members section, settings link, balance summary, activity list, and the add-expense action', () => {
            renderPage();

            expect(screen.getByRole('heading', { name: 'Weekend Trip' })).toBeInTheDocument();
            expect(screen.getByTestId('group-members-section')).toBeInTheDocument();
            expect(screen.getByTestId('group-balance-summary')).toHaveTextContent('group-1');
            expect(screen.getByRole('heading', { name: /activity/i })).toBeInTheDocument();
            expect(screen.getByTestId('group-activity-list')).toHaveTextContent('group-1-2');
            expect(screen.getByTestId('add-expense-action')).toHaveTextContent('group-1-2');

            // Recording a payment lives on the balance page now, beside the
            // position it settles, so this page should not offer it too.
            expect(screen.queryByTestId('record-payment-action')).not.toBeInTheDocument();
        });

        it('links the settings button to the group settings page', () => {
            renderPage();

            expect(screen.getByRole('link', { name: /group settings/i })).toHaveAttribute(
                'href',
                '/groups/group-1/settings',
            );
        });

        it('links to analytics scoped to the current group', () => {
            renderPage();

            expect(screen.getByRole('link', { name: /view group analytics/i })).toHaveAttribute(
                'href',
                '/analytics?groupId=group-1',
            );
        });

        it('passes loading and fetching state with an empty member fallback', () => {
            vi.mocked(useGroup).mockReturnValue({
                data: group,
                isLoading: false,
                isError: false,
                isFetching: true,
            } as unknown as ReturnType<typeof useGroup>);
            vi.mocked(useGroupMembers).mockReturnValue({
                data: undefined,
                isLoading: true,
                isFetching: true,
            } as unknown as ReturnType<typeof useGroupMembers>);

            renderPage();

            expect(screen.getByTestId('group-members-section')).toHaveTextContent(
                '0-true-true-true',
            );
            expect(screen.getByTestId('group-activity-list')).toHaveTextContent('group-1-0');
            expect(screen.getByTestId('add-expense-action')).toHaveTextContent('group-1-0');
        });
    });
});
