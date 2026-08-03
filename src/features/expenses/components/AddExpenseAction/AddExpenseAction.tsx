import { ReceiptIndianRupee } from 'lucide-react';
import { Link } from 'react-router';

import type { User } from '@data/entities';

interface AddExpenseActionProps {
    readonly groupId: string;
    readonly members: User[];
    // Fired when the trigger is clicked, before navigating away — lets a parent
    // fan-out menu (GroupFabMenu) collapse itself without this component needing
    // to know that menu exists.
    readonly onTriggerClick?: () => void;
}

export function AddExpenseAction({ groupId, members, onTriggerClick }: AddExpenseActionProps) {
    if (members.length === 0) return null;

    return (
        <Link
            to={`/groups/${groupId}/expenses/new`}
            aria-label="Add expense"
            title="Add expense"
            onClick={onTriggerClick}
            className="bg-brand-600 hover:bg-brand-700 inline-flex size-12 cursor-pointer items-center justify-center rounded-full text-white shadow-lg"
        >
            <ReceiptIndianRupee className="size-5" />
        </Link>
    );
}
