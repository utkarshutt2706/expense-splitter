import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Group, User } from '@data/entities';
import { useGroup, useGroupMembers } from '@features/groups';
import { GroupDetailPage } from './GroupDetailPage';

vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return { ...actual, useParams: () => ({ groupId: 'group-1' }) };
});

vi.mock('@features/groups', () => ({
    useGroup: vi.fn(),
    useGroupMembers: vi.fn(),
}));

vi.mock('@features/groups/components/GroupNameEditor', () => ({
    GroupNameEditor: ({
        group,
        isEditing,
        onEditingChange,
    }: {
        group: Group;
        isEditing: boolean;
        onEditingChange: (isEditing: boolean) => void;
    }) => (
        <div data-testid="group-name-editor">
            <span>{group.name}</span>
            <button type="button" onClick={() => onEditingChange(!isEditing)}>
                Toggle editing
            </button>
        </div>
    ),
}));

vi.mock('@features/groups/components/GroupMembersSection', () => ({
    GroupMembersSection: () => <div data-testid="group-members-section" />,
}));

vi.mock('@features/groups/components/MemberAvatarsSkeleton', () => ({
    MemberAvatarsSkeleton: () => <div data-testid="member-avatars-skeleton" />,
}));

vi.mock('@features/expenses', () => ({
    AddExpenseAction: ({ groupId, members }: { groupId: string; members: User[] }) => (
        <div data-testid="add-expense-action">{`${groupId}-${members.length}`}</div>
    ),
    GroupActivityList: ({ groupId, members }: { groupId: string; members: User[] }) => (
        <div data-testid="group-activity-list">{`${groupId}-${members.length}`}</div>
    ),
    GroupBalanceSummary: ({ groupId }: { groupId: string }) => (
        <div data-testid="group-balance-summary">{groupId}</div>
    ),
}));

vi.mock('@features/payments', () => ({
    RecordPaymentAction: ({ groupId, members }: { groupId: string; members: User[] }) => (
        <div data-testid="record-payment-action">{`${groupId}-${members.length}`}</div>
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
        expect(screen.queryByTestId('group-name-editor')).not.toBeInTheDocument();
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

        it('renders the name editor, members section, settings button, balance summary, activity list, and add-expense/record-payment actions', () => {
            renderPage();

            expect(screen.getByTestId('group-name-editor')).toHaveTextContent('Weekend Trip');
            expect(screen.getByTestId('group-members-section')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /group settings/i })).toBeInTheDocument();
            expect(screen.getByTestId('group-balance-summary')).toHaveTextContent('group-1');
            expect(screen.getByRole('heading', { name: /activity/i })).toBeInTheDocument();
            expect(screen.getByTestId('group-activity-list')).toHaveTextContent('group-1-2');
            expect(screen.getByTestId('add-expense-action')).toHaveTextContent('group-1-2');
            expect(screen.getByTestId('record-payment-action')).toHaveTextContent('group-1-2');
        });

        it('hides the members section while the group name is being edited', async () => {
            const user = userEvent.setup();
            renderPage();

            await user.click(screen.getByRole('button', { name: /toggle editing/i }));

            expect(screen.queryByTestId('group-members-section')).not.toBeInTheDocument();
        });

        it('still shows the add-expense action while the group name is being edited', async () => {
            const user = userEvent.setup();
            renderPage();

            await user.click(screen.getByRole('button', { name: /toggle editing/i }));

            expect(screen.getByTestId('add-expense-action')).toBeInTheDocument();
        });
    });
});
