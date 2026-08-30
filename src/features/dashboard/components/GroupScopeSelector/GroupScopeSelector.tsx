import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronDown, Search } from 'lucide-react';
import { useRef, useState } from 'react';

import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { ResponsivePopoverContent } from '@shared/components';

export function GroupScopeSelector({
    scope,
    groups,
    value,
    onChange,
}: Readonly<{
    scope: 'dashboard' | 'analytics';
    groups: DashboardGroupSpend[];
    value: string | null;
    onChange: (groupId: string | null) => void;
}>) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const contentRef = useRef<HTMLDivElement>(null);

    const labelId = `${scope}-scope-label`;
    const valueId = `${scope}-scope-value`;

    const selected = groups.find((group) => group.groupId === value);

    const filteredGroups = groups.filter((group) =>
        group.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
    );

    function select(groupId: string | null) {
        onChange(groupId);
        setOpen(false);
        setQuery('');
    }

    return (
        <div className="w-full text-sm font-medium">
            <span id={labelId}>Group:</span>

            <Popover.Root
                open={open}
                onOpenChange={(nextOpen) => {
                    setOpen(nextOpen);

                    if (!nextOpen) {
                        setQuery('');
                    }
                }}
            >
                <Popover.Trigger asChild>
                    <button
                        type="button"
                        aria-labelledby={`${labelId} ${valueId}`}
                        aria-haspopup="dialog"
                        aria-expanded={open}
                        className="border-border bg-surface focus-visible:ring-brand-500 mt-1 flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 text-left outline-none focus-visible:ring-2"
                    >
                        <span id={valueId} className="truncate">
                            {selected?.name ?? 'All groups'}
                        </span>

                        <ChevronDown className="text-muted-foreground size-4 shrink-0" />
                    </button>
                </Popover.Trigger>

                <Popover.Portal>
                    <ResponsivePopoverContent
                        ref={contentRef}
                        align="start"
                        sideOffset={8}
                        aria-label={`Choose ${scope} group`}
                        onOpenAutoFocus={(event) => {
                            const searchInput =
                                contentRef.current?.querySelector<HTMLInputElement>('input');

                            if (searchInput) {
                                event.preventDefault();
                                searchInput.focus();
                            }
                        }}
                        className="border-border bg-surface z-50 w-[var(--radix-popover-trigger-width)] min-w-72 rounded-lg border p-2 shadow-lg"
                    >
                        {groups.length > 5 && (
                            <label className="relative block">
                                <span className="sr-only">Search groups</span>

                                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />

                                <input
                                    type="search"
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Search groups"
                                    className="border-border bg-surface focus:border-brand-500 focus:ring-brand-500 min-h-11 w-full rounded-lg border pr-3 pl-9 outline-none focus:ring-1"
                                />
                            </label>
                        )}

                        <div
                            className={`${groups.length > 5 ? 'mt-2' : ''} max-h-72 overflow-y-auto`}
                            aria-label="Group scopes"
                        >
                            {!query && (
                                <GroupScopeOption
                                    name="All groups"
                                    selected={value === null}
                                    onSelect={() => select(null)}
                                />
                            )}

                            {filteredGroups.map((group) => (
                                <GroupScopeOption
                                    key={group.groupId}
                                    name={group.name}
                                    selected={value === group.groupId}
                                    title={group.name}
                                    onSelect={() => select(group.groupId)}
                                />
                            ))}

                            {filteredGroups.length === 0 && (
                                <p className="text-muted-foreground px-3 py-4 text-center">
                                    No groups found
                                </p>
                            )}
                        </div>
                    </ResponsivePopoverContent>
                </Popover.Portal>
            </Popover.Root>
        </div>
    );
}

function GroupScopeOption({
    name,
    selected,
    title,
    onSelect,
}: Readonly<{
    name: string;
    selected: boolean;
    title?: string;
    onSelect: () => void;
}>) {
    return (
        <button
            type="button"
            onClick={onSelect}
            title={title}
            className="hover:bg-muted focus-visible:bg-muted flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2 text-left outline-none"
        >
            <span className="truncate">{name}</span>

            {selected && <Check className="text-brand-600 size-4 shrink-0" />}
        </button>
    );
}
