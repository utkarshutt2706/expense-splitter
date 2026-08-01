import { Handshake } from 'lucide-react';

// Placeholder for the settle-up flow (marking a simplified balance-page
// transaction as paid) — not built yet, so this is deliberately inert.
export function SettleUpAction() {
    return (
        <button
            type="button"
            aria-label="Settle up"
            title="Settle up (coming soon)"
            disabled
            className="bg-settled inline-flex size-12 cursor-not-allowed items-center justify-center rounded-full text-white shadow-lg"
        >
            <Handshake className="size-5" />
        </button>
    );
}
