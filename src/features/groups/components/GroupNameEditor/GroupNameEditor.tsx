import { Check, Pencil, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import type { Group } from '@data/entities';
import { useRenameGroup } from '@features/groups/hooks/useRenameGroup';

interface GroupNameEditorProps {
    readonly group: Group;
    readonly isEditing: boolean;
    readonly onEditingChange: (isEditing: boolean) => void;
}

export function GroupNameEditor({ group, isEditing, onEditingChange }: GroupNameEditorProps) {
    const renameGroup = useRenameGroup();
    const [nameInput, setNameInput] = useState('');
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) nameInputRef.current?.focus();
    }, [isEditing]);

    const startRenaming = () => {
        setNameInput(group.name);
        onEditingChange(true);
    };

    const rename = () => {
        const trimmedName = nameInput.trim();
        if (!trimmedName || trimmedName === group.name) {
            onEditingChange(false);
            return;
        }

        const toastId = toast.loading('Group is being renamed…');
        renameGroup.mutate(
            { id: group.id, name: trimmedName },
            {
                onSuccess: () => {
                    toast.success('Group renamed', { id: toastId });
                    onEditingChange(false);
                },
                onError: (error) => toast.error(error.message, { id: toastId }),
            },
        );
    };

    const cancelRename = () => {
        onEditingChange(false);
    };

    if (isEditing) {
        return (
            <>
                <input
                    ref={nameInputRef}
                    type="text"
                    value={nameInput}
                    onChange={(event) => setNameInput(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') rename();
                        if (event.key === 'Escape') cancelRename();
                    }}
                    disabled={renameGroup.isPending}
                    aria-label="Group name"
                    className="rounded-md border border-border bg-surface px-2 py-1 font-display text-xl font-medium text-surface-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-60"
                />
                <div className="flex items-center">
                    <button
                        type="button"
                        aria-label="Rename"
                        title="Rename"
                        onClick={rename}
                        disabled={renameGroup.isPending}
                        className="cursor-pointer rounded-md p-1.5 text-green-600 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Check className="size-4" />
                    </button>
                    <button
                        type="button"
                        aria-label="Cancel"
                        title="Cancel"
                        onClick={cancelRename}
                        disabled={renameGroup.isPending}
                        className="cursor-pointer rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            <h1 className="font-display text-xl font-medium text-surface-foreground">
                {group.name}
            </h1>
            <button
                type="button"
                aria-label={`Edit ${group.name}`}
                title={`Rename ${group.name}`}
                onClick={startRenaming}
                className="cursor-pointer rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            >
                <Pencil className="size-4" />
            </button>
        </>
    );
}
