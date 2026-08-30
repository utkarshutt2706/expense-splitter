import { Plus } from 'lucide-react';
import { Link } from 'react-router';

import type { User } from '@features/users/api/usersApi';

type AddExpenseActionProps = Readonly<{
    groupId: string;
    members: User[];
}>;

// The group's one floating action, carrying its label rather than an icon alone:
// a bare glyph left readers guessing which of several circles did what, and the
// title attribute that explained it needs a hover that touch devices do not
// have. Adding an expense is the overwhelmingly common thing to do here, so it
// gets the corner to itself instead of fanning out a menu.
export function AddExpenseAction({ groupId, members }: AddExpenseActionProps) {
    // Nothing to split against until somebody else is in the group.
    if (members.length === 0) return null;

    return (
        <Link
            to={`/groups/${groupId}/expenses/new`}
            className="bg-brand-600 hover:bg-brand-700 focus-visible:ring-brand-500 bottom-nav-clearance fixed right-6 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full px-5 font-medium text-white shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-offset-2 md:bottom-6"
        >
            <Plus aria-hidden="true" className="size-5" />
            Add expense
        </Link>
    );
}
