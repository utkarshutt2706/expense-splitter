import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';

interface FriendRowMenuProps {
    friendName: string;
    onEdit: () => void;
    onRemove: () => void;
}

export function FriendRowMenu({ friendName, onEdit, onRemove }: FriendRowMenuProps) {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    type="button"
                    aria-label={`Open actions for ${friendName}`}
                    className="cursor-pointer rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                >
                    <MoreVertical className="size-4" />
                </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    className="z-50 min-w-36 rounded-md border border-border bg-surface p-1 shadow-lg"
                >
                    <DropdownMenu.Item
                        onSelect={onEdit}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-surface-foreground outline-none hover:bg-muted"
                    >
                        <Pencil className="size-4 text-muted-foreground" />
                        Edit
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                        onSelect={onRemove}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 outline-none hover:bg-muted"
                    >
                        <Trash2 className="size-4" />
                        Remove
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
