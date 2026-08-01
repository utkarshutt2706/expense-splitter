import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';

interface FriendRowMenuProps {
    readonly friendName: string;
    readonly onEdit: () => void;
    readonly onRemove: () => void;
}

export function FriendRowMenu({ friendName, onEdit, onRemove }: FriendRowMenuProps) {
    return (
        <DropdownMenu.Root modal={false}>
            <DropdownMenu.Trigger asChild>
                <button
                    type="button"
                    aria-label={`Open actions for ${friendName}`}
                    className="text-muted-foreground hover:bg-muted cursor-pointer rounded-md p-1.5"
                >
                    <MoreVertical className="size-4" />
                </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    className="border-border bg-surface z-50 min-w-36 rounded-md border p-1 shadow-lg"
                >
                    <DropdownMenu.Item
                        onSelect={onEdit}
                        className="text-surface-foreground hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-medium outline-none"
                    >
                        <Pencil className="text-muted-foreground size-4" />
                        Edit
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                        onSelect={onRemove}
                        className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 outline-none"
                    >
                        <Trash2 className="size-4" />
                        Remove
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
