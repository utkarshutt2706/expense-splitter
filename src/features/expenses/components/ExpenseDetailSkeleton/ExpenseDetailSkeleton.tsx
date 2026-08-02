import { Skeleton } from '@shared/components';

// Mirrors ExpenseDetailPage's loaded body shape (amount + subtext, then a
// payer row with a connector-line split list beneath it) so the page doesn't
// shift once the real expense arrives.
export function ExpenseDetailSkeleton() {
    return (
        <>
            <div>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="mt-2 h-4 w-56" />
            </div>

            <div>
                <div className="flex items-center gap-3">
                    <Skeleton className="size-9 shrink-0 rounded-full" />
                    <Skeleton className="h-5 w-48" />
                </div>

                <ul className="relative mt-3 ml-4.5 flex flex-col gap-4">
                    <span
                        aria-hidden="true"
                        className="bg-border absolute top-0 bottom-6 left-0 w-px"
                    />
                    {[0, 1].map((index) => (
                        <li key={index} className="relative flex items-center gap-2 pl-6">
                            <span
                                aria-hidden="true"
                                className={
                                    index === 1
                                        ? 'border-border absolute top-0 left-0 h-1/2 w-5 rounded-bl-md border-b border-l'
                                        : 'bg-border absolute top-1/2 left-0 h-px w-5 -translate-y-1/2'
                                }
                            />
                            <Skeleton className="size-6 shrink-0 rounded-full" />
                            <Skeleton className="h-4 w-32" />
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
}
