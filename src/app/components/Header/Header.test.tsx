import { render, screen } from '@testing-library/react';
import { MemoryRouter, useParams } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGroup } from '@features/groups';
import { Header } from './Header';

vi.mock('react-router', async (importOriginal) => ({
    ...(await importOriginal<typeof import('react-router')>()),
    useParams: vi.fn(),
}));

vi.mock('@features/groups', () => ({
    useGroup: vi.fn(),
}));

describe('Header', () => {
    beforeEach(() => {
        vi.mocked(useParams).mockReturnValue({});
        vi.mocked(useGroup).mockReturnValue({
            data: undefined,
        } as unknown as ReturnType<typeof useGroup>);
    });

    it('shows the title matching the current route', () => {
        render(
            <MemoryRouter initialEntries={['/friends']}>
                <Header />
            </MemoryRouter>,
        );

        expect(screen.getByRole('heading', { name: 'Friends' })).toBeInTheDocument();
    });

    it("shows the group's name on a group detail route", () => {
        vi.mocked(useParams).mockReturnValue({ groupId: 'group-1' });
        vi.mocked(useGroup).mockReturnValue({
            data: { id: 'group-1', name: 'Weekend Trip', memberIds: [], createdAt: '' },
        } as unknown as ReturnType<typeof useGroup>);

        render(
            <MemoryRouter initialEntries={['/groups/group-1']}>
                <Header />
            </MemoryRouter>,
        );

        expect(screen.getByRole('heading', { name: 'Weekend Trip' })).toBeInTheDocument();
    });

    it('shows a fallback title while the group name is still loading', () => {
        vi.mocked(useParams).mockReturnValue({ groupId: 'group-1' });

        render(
            <MemoryRouter initialEntries={['/groups/group-1']}>
                <Header />
            </MemoryRouter>,
        );

        expect(screen.getByRole('heading', { name: 'Group Detail' })).toBeInTheDocument();
    });
});
