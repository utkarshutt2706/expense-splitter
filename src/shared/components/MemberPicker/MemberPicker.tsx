import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown } from 'lucide-react';

import { useCurrentUser } from '@app/hooks';
import type { User } from '@data/entities';
import { Avatar } from '../Avatar';

interface MemberPickerProps {
    readonly members: User[];
    readonly value: string;
    readonly onChange: (id: string) => void;
    readonly ariaLabel: string;
    readonly placeholder: string;
}

function labelFor(member: User, currentUserId: string | undefined): string {
    return member.id === currentUserId ? 'You' : member.name;
}

export function MemberPicker({
    members,
    value,
    onChange,
    ariaLabel,
    placeholder,
}: MemberPickerProps) {
    const { data: currentUser } = useCurrentUser();
    const selected = members.find((member) => member.id === value);

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    type="button"
                    aria-label={ariaLabel}
                    className="border-border bg-surface text-surface-foreground focus-visible:ring-brand-500 flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-sm outline-none focus-visible:ring-2"
                >
                    <span className="flex items-center gap-2">
                        {selected && <Avatar name={selected.name} size="sm" />}
                        {selected ? labelFor(selected, currentUser?.id) : placeholder}
                    </span>
                    <ChevronDown className="text-muted-foreground size-4" />
                </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="start"
                    sideOffset={4}
                    className="border-border bg-surface z-50 w-64 rounded-lg border p-1 shadow-lg"
                >
                    <DropdownMenu.RadioGroup value={value} onValueChange={onChange}>
                        {members.map((member) => (
                            <DropdownMenu.RadioItem
                                key={member.id}
                                value={member.id}
                                className="text-surface-foreground data-highlighted:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none"
                            >
                                <span aria-hidden="true">
                                    <Avatar name={member.name} />
                                </span>
                                {labelFor(member, currentUser?.id)}
                            </DropdownMenu.RadioItem>
                        ))}
                    </DropdownMenu.RadioGroup>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
