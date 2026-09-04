import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@features/users/api/usersApi';
import { GroupMemberAvatarRow } from './GroupMemberAvatarRow';

vi.mock('@shared/components', () => ({
    Avatar: ({ name }: { name: string }) => <span data-testid="avatar">{name}</span>,
}));

const members = ['Alex', 'Blair', 'Casey', 'Dev'].map((name, index) => ({
    id: `${index}`,
    name,
})) as User[];

describe('GroupMemberAvatarRow', () => {
    it('renders only the visible members and reports overflow', () => {
        render(
            <GroupMemberAvatarRow
                members={members}
                maxVisible={2}
                className="extra"
                testId="members"
            />,
        );
        expect(screen.getByTestId('members')).toHaveClass('-space-x-3', 'extra');
        expect(screen.getAllByTestId('avatar').map((node) => node.textContent)).toEqual([
            'Alex',
            'Blair',
        ]);
        expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('omits overflow when every member is visible', () => {
        render(
            <GroupMemberAvatarRow members={members} maxVisible={4} className="" testId="members" />,
        );
        expect(screen.getAllByTestId('avatar')).toHaveLength(4);
        expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
    });
});
