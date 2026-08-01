import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { GroupMembersSection } from './GroupMembersSection';

vi.mock('../GroupMembersStack', () => ({
    GroupMembersStack: () => <div data-testid="group-members-stack" />,
}));

const members: User[] = [{ id: 'current-user', name: 'Alex Morgan', email: 'alex@example.com' }];

function renderSection(overrides: Partial<Parameters<typeof GroupMembersSection>[0]> = {}) {
    return render(
        <GroupMembersSection
            members={members}
            isMembersLoading={false}
            isMembersFetching={false}
            isGroupFetching={false}
            {...overrides}
        />,
    );
}

describe('GroupMembersSection', () => {
    it('shows the member stack when nothing is loading', () => {
        renderSection();

        expect(screen.getByTestId('group-members-stack')).toBeInTheDocument();
    });

    it('shows the member avatars skeleton instead of the stack while members are loading', () => {
        renderSection({ isMembersLoading: true });

        expect(screen.queryByTestId('group-members-stack')).not.toBeInTheDocument();
    });

    it('shows the member avatars skeleton while the group is refetching', () => {
        renderSection({ isGroupFetching: true });

        expect(screen.queryByTestId('group-members-stack')).not.toBeInTheDocument();
    });

    it('shows the member avatars skeleton while members are refetching', () => {
        renderSection({ isMembersFetching: true });

        expect(screen.queryByTestId('group-members-stack')).not.toBeInTheDocument();
    });
});
