import { ArrowLeft, Check, Pencil, Trash2, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';

import { GroupMembersStack, useGroup, useGroupMembers, useRenameGroup } from '@features/groups';

export function GroupDetailPage() {
    const { groupId } = useParams<{ groupId: string }>();
    const { data: group, isLoading, isError } = useGroup(groupId ?? '');
    const { data: members } = useGroupMembers(group?.memberIds ?? []);
    const renameGroup = useRenameGroup();

    const [isEditingName, setIsEditingName] = useState(false);
    const [nameInput, setNameInput] = useState('');
    const nameInputRef = useRef<HTMLInputElement>(null);

    const displayedName = group?.name ?? '';

    useEffect(() => {
        if (isEditingName) nameInputRef.current?.focus();
    }, [isEditingName]);

    const startRenaming = () => {
        setNameInput(displayedName);
        setIsEditingName(true);
    };

    const rename = () => {
        const trimmedName = nameInput.trim();
        setIsEditingName(false);
        if (!group || !trimmedName || trimmedName === group.name) return;

        const toastId = toast.loading('Group is being renamed…');
        renameGroup.mutate(
            { id: group.id, name: trimmedName },
            {
                onSuccess: () => toast.success('Group renamed', { id: toastId }),
                onError: (error) => toast.error(error.message, { id: toastId }),
            },
        );
    };

    const cancelRename = () => {
        setIsEditingName(false);
    };

    let content: ReactNode;
    if (isLoading) {
        content = <div className="text-muted-foreground">Loading group…</div>;
    } else if (isError || !group) {
        content = <div className="text-red-600">Couldn't load this group.</div>;
    } else {
        content = (
            <div className="flex items-center gap-3">
                {isEditingName ? (
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
                            aria-label="Group name"
                            className="rounded-md border border-border bg-surface px-2 py-1 font-display text-xl font-medium text-surface-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        />
                        <div className="flex items-center">
                            <button
                                type="button"
                                aria-label="Rename"
                                title="Rename"
                                onClick={rename}
                                className="cursor-pointer rounded-md p-1.5 text-green-600 hover:bg-muted"
                            >
                                <Check className="size-4" />
                            </button>
                            <button
                                type="button"
                                aria-label="Cancel"
                                title="Cancel"
                                onClick={cancelRename}
                                className="cursor-pointer rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h1 className="font-display text-xl font-medium text-surface-foreground">
                            {displayedName}
                        </h1>
                        <button
                            type="button"
                            aria-label={`Edit ${displayedName}`}
                            title={`Rename ${displayedName}`}
                            onClick={startRenaming}
                            className="cursor-pointer rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                        >
                            <Pencil className="size-4" />
                        </button>
                    </>
                )}

                <div className={isEditingName ? 'hidden md:block' : undefined}>
                    <GroupMembersStack members={members ?? []} />
                </div>

                <button
                    type="button"
                    aria-label="Delete group"
                    title="Delete group"
                    className={`ml-auto inline-flex cursor-pointer items-center gap-1 rounded-md border border-toast-error-text bg-toast-error-bg p-2 text-sm font-medium text-toast-error-text hover:opacity-80 md:px-3 md:py-1.5 ${isEditingName ? 'hidden md:inline-flex' : ''}`}
                >
                    <Trash2 className="size-4" />
                    <span className="hidden md:inline">Delete group</span>
                </button>
            </div>
        );
    }

    return (
        <div>
            <Link
                to="/groups"
                className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-surface-foreground"
            >
                <ArrowLeft className="size-4" />
                Back to groups
            </Link>

            {content}
        </div>
    );
}
