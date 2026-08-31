import type { LineChart } from 'lucide-react';
import type { ReactNode } from 'react';

export type ChartFrameProps = Readonly<{
    title: string;
    description: string;
    icon: typeof LineChart;
    children: ReactNode;
}>;

export function ChartFrame({ title, description, icon: Icon, children }: ChartFrameProps) {
    return (
        <section
            aria-labelledby={`${title}-heading`}
            className="border-border bg-surface min-w-0 rounded-2xl border p-5 md:p-6"
        >
            <div className="flex items-start gap-3">
                <span className="bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <Icon aria-hidden="true" className="size-5" />
                </span>
                <div>
                    <h2 id={`${title}-heading`} className="text-xl font-semibold">
                        {title}
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">{description}</p>
                </div>
            </div>
            {children}
        </section>
    );
}
