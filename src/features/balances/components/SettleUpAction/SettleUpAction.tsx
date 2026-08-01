import { Handshake } from 'lucide-react';
import { Link } from 'react-router';

interface SettleUpActionProps {
    readonly groupId: string;
}

// Settling up a specific transaction happens on the balance page itself
// (MemberBalanceAccordion, reusing the record-a-payment core) — there's no single
// transaction to prefill from here, so this just gets the user there.
export function SettleUpAction({ groupId }: SettleUpActionProps) {
    return (
        <Link
            to={`/groups/${groupId}/balance`}
            aria-label="Settle up"
            title="Settle up"
            className="bg-settled inline-flex size-12 cursor-pointer items-center justify-center rounded-full text-white shadow-lg hover:opacity-90"
        >
            <Handshake className="size-5" />
        </Link>
    );
}
