import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCreateExpense } from '@features/expenses';
import { useFriends } from '@features/friends';
import { useGroup, useGroupMembers, useRenameGroup, useUpdateGroupMembers } from '@features/groups';
import { GroupDetailPage } from './GroupDetailPage';

vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return { ...actual, useParams: () => ({ groupId: 'group-1' }) };
});

vi.mock('@features/friends', () => ({
    useFriends: vi.fn(),
}));

vi.mock('@features/expenses', () => ({
    useCreateExpense: vi.fn(),
    AddExpenseDialog: ({
        onSubmit,
    }: {
        onSubmit: (values: {
            description: string;
            amount: number;
            paidByUserId: string;
            participantUserIds: string[];
        }) => void;
    }) => (
        <div data-testid="add-expense-dialog">
            <button
                type="button"
                onClick={() =>
                    onSubmit({
                        description: 'Groceries',
                        amount: 42.5,
                        paidByUserId: 'current-user',
                        participantUserIds: ['friend-1'],
                    })
                }
            >
                Fake add expense submit
            </button>
        </div>
    ),
}));

vi.mock('@features/groups', () => ({
    useGroup: vi.fn(),
    useGroupMembers: vi.fn(),
    useRenameGroup: vi.fn(),
    useUpdateGroupMembers: vi.fn(),
    GroupMembersStack: () => <div data-testid="group-members-stack" />,
    EditGroupMembersDialog: ({
        onSubmit,
    }: {
        onSubmit: (values: { memberIds: string[] }) => void;
    }) => (
        <div data-testid="edit-group-members-dialog">
            <button type="button" onClick={() => onSubmit({ memberIds: ['friend-2'] })}>
                Fake edit members submit
            </button>
        </div>
    ),
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
        vi.mocked(useUpdateGroupMembers).mockReturnValue({
            mutate: vi.fn(),
        } as unknown as ReturnType<typeof useUpdateGroupMembers>);
        vi.mocked(useFriends).mockReturnValue({
            data: [],
        } as unknown as ReturnType<typeof useFriends>);
        vi.mocked(useCreateExpense).mockReturnValue({
            mutate: vi.fn(),
        } as unknown as ReturnType<typeof useCreateExpense>);
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
        expect(screen.queryByRole('button', { name: 'Add expense' })).not.toBeInTheDocument();
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

        it('renames the group, keeping edit mode open until the mutation succeeds', async () => {
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
            expect(screen.getByRole('textbox', { name: /group name/i })).toBeInTheDocument();

            act(() => onSuccess?.());

            expect(toast.success).toHaveBeenCalledWith('Group renamed', { id: 'toast-id' });
            expect(screen.queryByRole('textbox', { name: /group name/i })).not.toBeInTheDocument();
        });

        it('updates the loading toast to an error toast and keeps edit mode open when it fails', async () => {
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
            expect(screen.getByRole('textbox', { name: /group name/i })).toBeInTheDocument();
        });

        it('disables the input and rename/cancel buttons while a rename is pending', async () => {
            vi.mocked(useRenameGroup).mockReturnValue({
                mutate: vi.fn(),
                isPending: true,
            } as unknown as ReturnType<typeof useRenameGroup>);

            const user = userEvent.setup();
            renderPage();

            await user.click(screen.getByRole('button', { name: /edit weekend trip/i }));

            expect(screen.getByRole('textbox', { name: /group name/i })).toBeDisabled();
            expect(screen.getByRole('button', { name: /^rename$/i })).toBeDisabled();
            expect(screen.getByRole('button', { name: /^cancel$/i })).toBeDisabled();
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
            await user.type(
                screen.getByRole('textbox', { name: /group name/i }),
                'Ski Trip{Enter}',
            );

            expect(screen.getByRole('textbox', { name: /group name/i })).toBeInTheDocument();

            act(() => onSuccess?.());

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

    describe('member editing flow', () => {
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

        it('updates group members and shows a loading toast, then success', async () => {
            let onSuccess: (() => void) | undefined;
            const mutate = vi.fn((_values, options: { onSuccess?: () => void }) => {
                onSuccess = options.onSuccess;
            });
            vi.mocked(useUpdateGroupMembers).mockReturnValue({
                mutate,
            } as unknown as ReturnType<typeof useUpdateGroupMembers>);

            const user = userEvent.setup();
            renderPage();

            await user.click(screen.getByRole('button', { name: /fake edit members submit/i }));

            expect(toast.loading).toHaveBeenCalledWith('Group members are being updated…');
            expect(mutate).toHaveBeenCalledWith(
                { id: 'group-1', memberIds: ['friend-2'] },
                expect.anything(),
            );

            act(() => onSuccess?.());

            expect(toast.success).toHaveBeenCalledWith('Group members updated', { id: 'toast-id' });
        });

        it('shows an error toast when updating members fails', async () => {
            let onError: ((error: Error) => void) | undefined;
            const mutate = vi.fn((_values, options: { onError?: (error: Error) => void }) => {
                onError = options.onError;
            });
            vi.mocked(useUpdateGroupMembers).mockReturnValue({
                mutate,
            } as unknown as ReturnType<typeof useUpdateGroupMembers>);

            const user = userEvent.setup();
            renderPage();

            await user.click(screen.getByRole('button', { name: /fake edit members submit/i }));
            onError?.(new Error('Something went wrong'));

            expect(toast.error).toHaveBeenCalledWith('Something went wrong', { id: 'toast-id' });
        });

        it('shows the member avatars skeleton instead of the stack while an update is pending', () => {
            vi.mocked(useUpdateGroupMembers).mockReturnValue({
                mutate: vi.fn(),
                isPending: true,
            } as unknown as ReturnType<typeof useUpdateGroupMembers>);

            renderPage();

            expect(screen.queryByTestId('group-members-stack')).not.toBeInTheDocument();
        });

        it('shows the member avatars skeleton while the group is refetching after an update', () => {
            vi.mocked(useGroup).mockReturnValue({
                data: group,
                isLoading: false,
                isError: false,
                isFetching: true,
            } as unknown as ReturnType<typeof useGroup>);

            renderPage();

            expect(screen.queryByTestId('group-members-stack')).not.toBeInTheDocument();
        });

        it('shows the member avatars skeleton while the member list is refetching after an update', () => {
            vi.mocked(useGroupMembers).mockReturnValue({
                data: [],
                isLoading: false,
                isFetching: true,
            } as unknown as ReturnType<typeof useGroupMembers>);

            renderPage();

            expect(screen.queryByTestId('group-members-stack')).not.toBeInTheDocument();
        });
    });

    describe('add expense flow', () => {
        beforeEach(() => {
            vi.mocked(useGroup).mockReturnValue({
                data: group,
                isLoading: false,
                isError: false,
            } as unknown as ReturnType<typeof useGroup>);
            vi.mocked(useGroupMembers).mockReturnValue({
                data: [{ id: 'current-user', name: 'Alex Morgan', email: 'alex@example.com' }],
            } as unknown as ReturnType<typeof useGroupMembers>);
        });

        it('renders an add expense button', () => {
            renderPage();

            expect(screen.getByRole('button', { name: 'Add expense' })).toBeInTheDocument();
        });

        it('shows the add expense button even when the current user is the only member', () => {
            vi.mocked(useGroupMembers).mockReturnValue({
                data: [{ id: 'current-user', name: 'Alex Morgan', email: 'alex@example.com' }],
            } as unknown as ReturnType<typeof useGroupMembers>);

            renderPage();

            expect(screen.getByRole('button', { name: 'Add expense' })).toBeInTheDocument();
        });

        it('hides the add expense button when the group has no members', () => {
            vi.mocked(useGroupMembers).mockReturnValue({
                data: [],
            } as unknown as ReturnType<typeof useGroupMembers>);

            renderPage();

            expect(screen.queryByRole('button', { name: 'Add expense' })).not.toBeInTheDocument();
        });

        it('adds an expense and shows a loading toast, then success', async () => {
            let onSuccess: (() => void) | undefined;
            const mutate = vi.fn((_values, options: { onSuccess?: () => void }) => {
                onSuccess = options.onSuccess;
            });
            vi.mocked(useCreateExpense).mockReturnValue({
                mutate,
            } as unknown as ReturnType<typeof useCreateExpense>);

            const user = userEvent.setup();
            renderPage();

            await user.click(screen.getByRole('button', { name: /fake add expense submit/i }));

            expect(toast.loading).toHaveBeenCalledWith('Expense is being added…');
            expect(mutate).toHaveBeenCalledWith(
                {
                    groupId: 'group-1',
                    description: 'Groceries',
                    amount: 42.5,
                    paidByUserId: 'current-user',
                    participantUserIds: ['friend-1'],
                },
                expect.anything(),
            );

            act(() => onSuccess?.());

            expect(toast.success).toHaveBeenCalledWith('Expense added', { id: 'toast-id' });
        });

        it('shows an error toast when adding an expense fails', async () => {
            let onError: ((error: Error) => void) | undefined;
            const mutate = vi.fn((_values, options: { onError?: (error: Error) => void }) => {
                onError = options.onError;
            });
            vi.mocked(useCreateExpense).mockReturnValue({
                mutate,
            } as unknown as ReturnType<typeof useCreateExpense>);

            const user = userEvent.setup();
            renderPage();

            await user.click(screen.getByRole('button', { name: /fake add expense submit/i }));
            onError?.(new Error('Something went wrong'));

            expect(toast.error).toHaveBeenCalledWith('Something went wrong', { id: 'toast-id' });
        });
    });
});
