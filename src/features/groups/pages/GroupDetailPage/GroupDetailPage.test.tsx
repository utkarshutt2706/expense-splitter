import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGroup, useGroupMembers, useRenameGroup } from '@features/groups';
import { GroupDetailPage } from './GroupDetailPage';

vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return { ...actual, useParams: () => ({ groupId: 'group-1' }) };
});

vi.mock('@features/groups', () => ({
    useGroup: vi.fn(),
    useGroupMembers: vi.fn(),
    useRenameGroup: vi.fn(),
    GroupMembersStack: () => <div data-testid="group-members-stack" />,
}));

vi.mock('sonner', () => ({
    toast: {
        loading: vi.fn(() => 'toast-id'),
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const group = {
    id: 'group-1',
    name: 'Weekend Trip',
    memberIds: ['current-user', 'friend-1'],
    createdAt: '',
};

function renderPage() {
    return render(
        <MemoryRouter>
            <GroupDetailPage />
        </MemoryRouter>,
    );
}

describe('GroupDetailPage', () => {
    beforeEach(() => {
        vi.mocked(useRenameGroup).mockReturnValue({
            mutate: vi.fn(),
        } as unknown as ReturnType<typeof useRenameGroup>);
    });

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

        expect(screen.getByRole('status', { name: /loading group/i })).toBeInTheDocument();
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

    it('renders the group name and a back link', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: [],
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByText('Weekend Trip')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /back to groups/i })).toHaveAttribute(
            'href',
            '/groups',
        );
    });

    it('keeps the member avatars skeleton visible when the group loaded but members are still fetching', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: undefined,
            isLoading: true,
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByText('Weekend Trip')).toBeInTheDocument();
        expect(screen.queryByTestId('group-members-stack')).not.toBeInTheDocument();
    });

    it('renders a delete group button', () => {
        vi.mocked(useGroup).mockReturnValue({
            data: group,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useGroup>);
        vi.mocked(useGroupMembers).mockReturnValue({
            data: [],
        } as unknown as ReturnType<typeof useGroupMembers>);

        renderPage();

        expect(screen.getByRole('button', { name: /delete group/i })).toBeInTheDocument();
    });

    describe('rename flow', () => {
        beforeEach(() => {
            vi.mocked(useGroup).mockReturnValue({
                data: group,
                isLoading: false,
                isError: false,
            } as unknown as ReturnType<typeof useGroup>);
            vi.mocked(useGroupMembers).mockReturnValue({
                data: [],
            } as unknown as ReturnType<typeof useGroupMembers>);
        });

        it('switches to an editable input when the edit button is clicked', async () => {
            const user = userEvent.setup();
            renderPage();

            await user.click(screen.getByRole('button', { name: /edit weekend trip/i }));

            expect(screen.getByRole('textbox', { name: /group name/i })).toHaveValue(
                'Weekend Trip',
            );
        });

        it('exits edit mode and does not rename when the name is unchanged', async () => {
            const mutate = vi.fn();
            vi.mocked(useRenameGroup).mockReturnValue({
                mutate,
            } as unknown as ReturnType<typeof useRenameGroup>);

            const user = userEvent.setup();
            renderPage();

            await user.click(screen.getByRole('button', { name: /edit weekend trip/i }));
            await user.click(screen.getByRole('button', { name: /^rename$/i }));

            expect(mutate).not.toHaveBeenCalled();
            expect(screen.queryByRole('textbox', { name: /group name/i })).not.toBeInTheDocument();
        });

        it('renames the group and shows a loading toast immediately, then updates it to success', async () => {
            let onSuccess: (() => void) | undefined;
            vi.mocked(useRenameGroup).mockReturnValue({
                mutate: vi.fn((_values, options: { onSuccess?: () => void }) => {
                    onSuccess = options.onSuccess;
                }),
            } as unknown as ReturnType<typeof useRenameGroup>);

            const user = userEvent.setup();
            renderPage();

            await user.click(screen.getByRole('button', { name: /edit weekend trip/i }));
            await user.clear(screen.getByRole('textbox', { name: /group name/i }));
            await user.type(screen.getByRole('textbox', { name: /group name/i }), 'Ski Trip');
            await user.click(screen.getByRole('button', { name: /^rename$/i }));

            expect(toast.loading).toHaveBeenCalledWith('Group is being renamed…');

            onSuccess?.();

            expect(toast.success).toHaveBeenCalledWith('Group renamed', { id: 'toast-id' });
        });

        it('updates the loading toast to an error toast with the error message when it fails', async () => {
            let onError: ((error: Error) => void) | undefined;
            vi.mocked(useRenameGroup).mockReturnValue({
                mutate: vi.fn((_values, options: { onError?: (error: Error) => void }) => {
                    onError = options.onError;
                }),
            } as unknown as ReturnType<typeof useRenameGroup>);

            const user = userEvent.setup();
            renderPage();

            await user.click(screen.getByRole('button', { name: /edit weekend trip/i }));
            await user.clear(screen.getByRole('textbox', { name: /group name/i }));
            await user.type(screen.getByRole('textbox', { name: /group name/i }), 'Ski Trip');
            await user.click(screen.getByRole('button', { name: /^rename$/i }));
            onError?.(new Error('Something went wrong'));

            expect(toast.error).toHaveBeenCalledWith('Something went wrong', { id: 'toast-id' });
        });

        it('discards the edit when cancelled, without renaming', async () => {
            const mutate = vi.fn();
            vi.mocked(useRenameGroup).mockReturnValue({
                mutate,
            } as unknown as ReturnType<typeof useRenameGroup>);

            const user = userEvent.setup();
            renderPage();

            await user.click(screen.getByRole('button', { name: /edit weekend trip/i }));
            await user.clear(screen.getByRole('textbox', { name: /group name/i }));
            await user.type(screen.getByRole('textbox', { name: /group name/i }), 'Ski Trip');
            await user.click(screen.getByRole('button', { name: /^cancel$/i }));

            expect(screen.getByText('Weekend Trip')).toBeInTheDocument();
            expect(screen.queryByText('Ski Trip')).not.toBeInTheDocument();
            expect(mutate).not.toHaveBeenCalled();
        });

        it('renames when Enter is pressed in the input', async () => {
            const mutate = vi.fn();
            vi.mocked(useRenameGroup).mockReturnValue({
                mutate,
            } as unknown as ReturnType<typeof useRenameGroup>);

            const user = userEvent.setup();
            renderPage();

            await user.click(screen.getByRole('button', { name: /edit weekend trip/i }));
            await user.clear(screen.getByRole('textbox', { name: /group name/i }));
            await user.type(
                screen.getByRole('textbox', { name: /group name/i }),
                'Ski Trip{Enter}',
            );

            expect(mutate).toHaveBeenCalledWith(
                { id: 'group-1', name: 'Ski Trip' },
                expect.anything(),
            );
            expect(screen.queryByRole('textbox', { name: /group name/i })).not.toBeInTheDocument();
        });

        it('discards the edit when Escape is pressed in the input', async () => {
            const mutate = vi.fn();
            vi.mocked(useRenameGroup).mockReturnValue({
                mutate,
            } as unknown as ReturnType<typeof useRenameGroup>);

            const user = userEvent.setup();
            renderPage();

            await user.click(screen.getByRole('button', { name: /edit weekend trip/i }));
            await user.clear(screen.getByRole('textbox', { name: /group name/i }));
            await user.type(
                screen.getByRole('textbox', { name: /group name/i }),
                'Ski Trip{Escape}',
            );

            expect(mutate).not.toHaveBeenCalled();
            expect(screen.getByText('Weekend Trip')).toBeInTheDocument();
            expect(screen.queryByText('Ski Trip')).not.toBeInTheDocument();
        });
    });
});
