import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Group, User } from '@data/entities';
import { useGroup, useGroupMembers } from '@features/groups';
import { GroupSettingsPage } from './GroupSettingsPage';

vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return { ...actual, useParams: () => ({ groupId: 'group-1' }) };
});

vi.mock('@features/groups', () => ({
    useGroup: vi.fn(),
    useGroupMembers: vi.fn(),
}));

vi.mock('@features/groups/components/GroupNameEditor', () => ({
    GroupNameEditor: ({ group }: { group: Group }) => (
        <div data-testid="group-name-editor">{group.name}</div>
    ),
}));

vi.mock('@features/groups/components/EditGroupMembersAction', () => ({
    EditGroupMembersAction: ({ group, members }: { group: Group; members: User[] }) => (
        <div data-testid="edit-group-members-action">{`${group.id}-${members.length}`}</div>
    ),
}));

vi.mock('@features/groups/components/MemberList', () => ({
    MemberList: ({ members }: { members: User[] }) => (
        <div data-testid="member-list">{members.length}</div>
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
            <GroupSettingsPage />
        </MemoryRouter>,
    );
}

describe('GroupSettingsPage', () => {
    it('shows a loading message while fetching', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: [],
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByRole('status', { name: /loading group settings/i })).toBeInTheDocument();
    });

    it('shows an error message when the group fails to load', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: [],
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByText(/couldn't load this group/i)).toBeInTheDocument();
    });

    it('renders the back link to the group', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: [],
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByRole('link', { name: /back to group/i })).toHaveAttribute(
            'href',
            '/groups/group-1',
        );
    });

    describe('once the group has loaded', () => {
        beforeEach(() => {
            vi.mocked(useGroup).mockReturnValue({
                data: group,
                isLoading: false,
                isError: false,
            } as unknown as ReturnType<typeof useGroup>);
            vi.mocked(useGroupMembers).mockReturnValue({
                data: members,
            } as unknown as ReturnType<typeof useGroupMembers>);
        });

        it('renders the name editor, the add/remove members action, and the member list', () => {
            renderPage();

            expect(screen.getByTestId('group-name-editor')).toHaveTextContent('Weekend Trip');
            expect(screen.getByTestId('edit-group-members-action')).toHaveTextContent('group-1-2');
            expect(screen.getByTestId('member-list')).toHaveTextContent('2');
        });

        it('renders disabled leave-group and delete-group buttons', () => {
            renderPage();

            expect(screen.getByRole('button', { name: /leave group/i })).toBeDisabled();
            expect(screen.getByRole('button', { name: /delete group/i })).toBeDisabled();
        });
    });
});
