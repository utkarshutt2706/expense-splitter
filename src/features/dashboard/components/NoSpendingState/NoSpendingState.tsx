import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';

export type NoSpendingStateProps = Readonly<{
    description: string;
    link?: string;
    linkLabel?: string;
}>;

export function NoSpendingState({ description, link, linkLabel }: NoSpendingStateProps) {
    return (
        <section className="border-border bg-muted/40 rounded-2xl border p-5 md:p-6">
            <h2 className="text-xl font-semibold">No spending in this period</h2>
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
            {link && linkLabel && (
                <Link
                    to={link}
                    className="text-brand-600 mt-3 inline-flex min-h-11 cursor-pointer items-center font-semibold"
                >
                    {linkLabel}
                    <ArrowRight className="ml-2 size-4" />
                </Link>
            )}
        </section>
    );
}
