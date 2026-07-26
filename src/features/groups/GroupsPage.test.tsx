import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GroupsPage } from './GroupsPage';
import { useGroups } from './useGroups';

vi.mock('./useGroups', () => ({
    useGroups: vi.fn(),
}));

const groups = [
    {
        id: 'group-1',
        name: 'Weekend Trip',
        memberIds: ['current-user', 'friend-1', 'friend-2'],
        createdAt: '',
    },
    { id: 'group-2', name: 'Roommates', memberIds: ['current-user'], createdAt: '' },
];

describe('GroupsPage', () => {
    it('shows a loading message while fetching', () => {
        vi.mocked(useGroups).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useGroups>);

        render(<GroupsPage />);

        expect(screen.getByText(/loading groups/i)).toBeInTheDocument();
    });

    it('shows an error message when the query fails', () => {
        vi.mocked(useGroups).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        } as unknown as ReturnType<typeof useGroups>);

        render(<GroupsPage />);

        expect(screen.getByText(/couldn't load groups/i)).toBeInTheDocument();
    });

    it('shows an empty state when there are no groups', () => {
        vi.mocked(useGroups).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroups>);

        render(<GroupsPage />);

        expect(screen.getByText(/no groups yet/i)).toBeInTheDocument();
    });

    it('renders each group with its name and pluralized member count', () => {
        vi.mocked(useGroups).mockReturnValue({
            data: groups,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroups>);

        render(<GroupsPage />);

        expect(screen.getByText('Weekend Trip')).toBeInTheDocument();
        expect(screen.getByText('3 members')).toBeInTheDocument();
        expect(screen.getByText('Roommates')).toBeInTheDocument();
        expect(screen.getByText('1 member')).toBeInTheDocument();
    });
});
