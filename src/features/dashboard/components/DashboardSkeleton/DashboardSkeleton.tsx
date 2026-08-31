import { Skeleton } from '@shared/components';

export function DashboardSkeleton() {
    const filterSkeletons = ['period', 'group'];
    const metricSkeletons = ['paid', 'share', 'total'];
    const groupSkeletons = ['first', 'second'];

    return (
        <output aria-label="Loading dashboard" className="mx-auto block max-w-7xl space-y-6">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <Skeleton className="h-9 w-64 max-w-full" />
                    <Skeleton className="mt-2 h-5 w-80 max-w-full" />
                </div>

                <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                    {filterSkeletons.map((key) => (
                        <div key={key} className="w-full sm:w-72">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="mt-2 h-11 w-full rounded-lg" />
                        </div>
                    ))}
                </div>
            </header>

            <section className="border-border rounded-2xl border p-5 md:flex md:items-center md:justify-between md:gap-6 md:p-6">
                <div className="flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="mt-2 h-8 w-64 max-w-full" />
                    <Skeleton className="mt-2 h-4 w-80 max-w-full" />
                </div>

                <Skeleton className="mt-4 h-11 w-36 rounded-lg md:mt-0" />
            </section>

            <section className="border-border rounded-2xl border p-5 md:p-6">
                <div className="flex items-baseline justify-between gap-4">
                    <Skeleton className="h-7 w-60 max-w-full" />
                    <Skeleton className="h-4 w-20" />
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {metricSkeletons.map((key) => (
                        <div key={key}>
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="mt-2 h-9 w-44 max-w-full" />
                            <Skeleton className="mt-2 h-4 w-52 max-w-full" />
                        </div>
                    ))}
                </div>

                <div className="border-border mt-5 border-t pt-4">
                    <Skeleton className="h-4 w-96 max-w-full" />
                    <Skeleton className="mt-2 h-4 w-72 max-w-full" />
                </div>
            </section>

            <section className="space-y-4">
                <div>
                    <Skeleton className="h-8 w-52" />
                    <Skeleton className="mt-2 h-4 w-72 max-w-full" />
                </div>

                <div className="space-y-3">
                    {groupSkeletons.map((key) => (
                        <div
                            key={key}
                            className="border-border rounded-2xl border p-4 xl:grid xl:grid-cols-[minmax(12rem,1fr)_minmax(16rem,1.3fr)_10rem] xl:items-center xl:gap-6"
                        >
                            <div>
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="mt-2 h-4 w-48 max-w-full" />
                            </div>

                            <div className="mt-4 space-y-3 xl:mt-0">
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-4/5" />
                            </div>

                            <Skeleton className="mt-4 h-5 w-28 xl:mt-0 xl:ml-auto" />
                        </div>
                    ))}
                </div>
            </section>

            <span className="sr-only">Loading financial summary</span>
        </output>
    );
}
