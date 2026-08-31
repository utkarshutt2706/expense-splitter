import { Plus } from 'lucide-react';
import { Link } from 'react-router';

export function EmptyDashboard() {
    return (
        <section className="border-border bg-muted/40 rounded-2xl border p-8 text-center">
            <h2 className="text-2xl font-semibold">No shared spending yet</h2>
            <p className="text-muted-foreground mx-auto mt-2 max-w-lg text-sm">
                Create a group and record your first shared expense. Your payment, share, and
                balances will appear here.
            </p>
            <Link
                to="/groups"
                className="bg-brand-600 hover:bg-brand-700 mt-5 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white"
            >
                <Plus className="size-4" />
                Create a group
            </Link>
        </section>
    );
}
