import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown } from 'lucide-react';

import type { User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { Avatar } from '@shared/components';

interface PaidByPickerProps {
    readonly members: User[];
    readonly value: string;
    readonly onChange: (id: string) => void;
}

function labelFor(member: User): string {
    return member.id === CURRENT_USER_ID ? 'You' : member.name;
}

export function PaidByPicker({ members, value, onChange }: PaidByPickerProps) {
    const selected = members.find((member) => member.id === value);

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    type="button"
                    aria-label="Paid by"
                    className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-surface-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                    <span className="flex items-center gap-2">
                        {selected && <Avatar name={selected.name} size="sm" />}
                        {selected ? labelFor(selected) : 'Select who paid'}
                    </span>
                    <ChevronDown className="size-4 text-muted-foreground" />
                </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="start"
                    sideOffset={4}
                    className="z-50 w-64 rounded-lg border border-border bg-surface p-1 shadow-lg"
                >
                    <DropdownMenu.RadioGroup value={value} onValueChange={onChange}>
                        {members.map((member) => (
                            <DropdownMenu.RadioItem
                                key={member.id}
                                value={member.id}
                                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-surface-foreground outline-none data-highlighted:bg-muted"
                            >
                                <span aria-hidden="true">
                                    <Avatar name={member.name} />
                                </span>
                                {labelFor(member)}
                            </DropdownMenu.RadioItem>
                        ))}
                    </DropdownMenu.RadioGroup>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
