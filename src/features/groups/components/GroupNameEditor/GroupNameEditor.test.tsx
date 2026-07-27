import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Group } from '@data/entities';
import { useRenameGroup } from '@features/groups/hooks/useRenameGroup';
import { GroupNameEditor } from './GroupNameEditor';

vi.mock('@features/groups/hooks/useRenameGroup', () => ({
    useRenameGroup: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: {
        loading: vi.fn(() => 'toast-id'),
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const group: Group = {
    id: 'group-1',
    name: 'Weekend Trip',
    memberIds: ['current-user', 'friend-1'],
    createdAt: '',
};

function Harness() {
    const [isEditing, setIsEditing] = useState(false);
    return (
        <div className="flex items-center gap-3">
            <GroupNameEditor group={group} isEditing={isEditing} onEditingChange={setIsEditing} />
        </div>
    );
}

describe('GroupNameEditor', () => {
    beforeEach(() => {
        vi.mocked(useRenameGroup).mockReturnValue({
            mutate: vi.fn(),
        } as unknown as ReturnType<typeof useRenameGroup>);
    });

    it('switches to an editable input when the edit button is clicked', async () => {
        const user = userEvent.setup();
        render(<Harness />);

        await user.click(screen.getByRole('button', { name: /edit weekend trip/i }));

        expect(screen.getByRole('textbox', { name: /group name/i })).toHaveValue('Weekend Trip');
    });

    it('exits edit mode and does not rename when the name is unchanged', async () => {
        const mutate = vi.fn();
        vi.mocked(useRenameGroup).mockReturnValue({
            mutate,
        } as unknown as ReturnType<typeof useRenameGroup>);

        const user = userEvent.setup();
        render(<Harness />);

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
        render(<Harness />);

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
        render(<Harness />);

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
        render(<Harness />);

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
        render(<Harness />);

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
        render(<Harness />);

        await user.click(screen.getByRole('button', { name: /edit weekend trip/i }));
        await user.clear(screen.getByRole('textbox', { name: /group name/i }));
        await user.type(screen.getByRole('textbox', { name: /group name/i }), 'Ski Trip{Enter}');

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
        render(<Harness />);

        await user.click(screen.getByRole('button', { name: /edit weekend trip/i }));
        await user.clear(screen.getByRole('textbox', { name: /group name/i }));
        await user.type(screen.getByRole('textbox', { name: /group name/i }), 'Ski Trip{Escape}');

        expect(mutate).not.toHaveBeenCalled();
        expect(screen.getByText('Weekend Trip')).toBeInTheDocument();
        expect(screen.queryByText('Ski Trip')).not.toBeInTheDocument();
    });
});
