import { UsersRound } from 'lucide-react';
import { useGroups } from './useGroups';

export function GroupsPage() {
    const { data: groups, isLoading, isError } = useGroups();

    return (
        <div>
            {isLoading ? (
                <div className="text-muted-foreground">Loading groups…</div>
            ) : isError ? (
                <div className="text-red-600">Couldn't load groups.</div>
            ) : !groups || groups.length === 0 ? (
                <div className="text-muted-foreground">No groups yet.</div>
            ) : (
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {groups.map((group) => (
                        <li
                            key={group.id}
                            className="flex items-center gap-3 rounded-lg border border-border p-3"
                        >
                            <span className="flex size-9 items-center justify-center rounded-full bg-brand-600 text-white">
                                <UsersRound className="size-4" />
                            </span>
                            <div className="flex-1">
                                <p className="font-medium text-surface-foreground">{group.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {group.memberIds.length}{' '}
                                    {group.memberIds.length === 1 ? 'member' : 'members'}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
