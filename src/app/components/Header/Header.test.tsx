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

vi.mock('@features/auth', () => ({
    ChangePasswordDialog: () => null,
}));

vi.mock('@app/hooks', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/hooks')>()),
    useCurrentUser: () => ({
        data: { id: 'current-user', name: 'Alex Morgan', email: 'alex@example.com' },
    }),
}));

function renderHeader(initialPath = '/friends') {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Header />
        </MemoryRouter>,
    );
}

describe('Header', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.mocked(useParams).mockReturnValue({});
        vi.mocked(useGroup).mockReturnValue({
            data: undefined,
        } as unknown as ReturnType<typeof useGroup>);
    });

    it('shows the title matching the current route', () => {
        renderHeader();

        expect(screen.getByRole('heading', { name: 'Friends' })).toBeInTheDocument();
    });

    it("shows the group's name on a group detail route", () => {
        vi.mocked(useParams).mockReturnValue({ groupId: 'group-1' });
        vi.mocked(useGroup).mockReturnValue({
            data: { id: 'group-1', name: 'Weekend Trip', memberIds: [], createdAt: '' },
        } as unknown as ReturnType<typeof useGroup>);

        renderHeader('/groups/group-1');

        expect(screen.getByRole('heading', { name: 'Weekend Trip' })).toBeInTheDocument();
    });

    it('shows a fallback title while the group name is still loading', () => {
        vi.mocked(useParams).mockReturnValue({ groupId: 'group-1' });

        renderHeader('/groups/group-1');

        expect(screen.getByRole('heading', { name: 'Group Detail' })).toBeInTheDocument();
    });

    it('carries a brand link back to the root path, only where the sidebar is absent', () => {
        renderHeader();

        const brand = screen.getByRole('link', { name: /expense splitter/i });
        expect(brand).toHaveAttribute('href', '/');
        expect(brand.className.split(/\s+/)).toContain('md:hidden');
    });

    it('carries the user menu below md, where the sidebar no longer hosts it', () => {
        renderHeader();

        const trigger = screen.getByRole('button', { name: /open user menu/i });
        expect(trigger).toBeInTheDocument();
        expect(trigger.parentElement?.className.split(/\s+/)).toContain('md:hidden');
    });

    it('does not host navigation links — those belong to the sidebar and bottom bar', () => {
        renderHeader();

        expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /^groups$/i })).not.toBeInTheDocument();
    });
});
