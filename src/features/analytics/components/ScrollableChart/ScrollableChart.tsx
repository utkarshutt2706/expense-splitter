import type { ReactNode } from 'react';
import { ResponsiveContainer } from 'recharts';

import { PinnedValueAxis } from '@features/analytics/components/PinnedValueAxis';
import { MIN_CATEGORY_WIDTH, PLOT_HEIGHT, VALUE_AXIS_WIDTH } from '@features/analytics/utils';

export type ScrollableChartProps = Readonly<{
    categories: number;
    perCategory?: number;
    label: string;
    ticks: number[];
    legend: readonly { name: string; fill: string }[];
    children: ReactNode;
}>;

export function ScrollableChart({
    categories,
    perCategory = MIN_CATEGORY_WIDTH,
    label,
    ticks,
    legend,
    children,
}: ScrollableChartProps) {
    return (
        <div className="mt-6">
            <div className="relative" style={{ paddingLeft: VALUE_AXIS_WIDTH }}>
                <PinnedValueAxis ticks={ticks} />
                <div className="min-w-0 overflow-x-auto">
                    <div
                        style={{ minWidth: `${categories * perCategory}px`, height: PLOT_HEIGHT }}
                        aria-label={label}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            {children}
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            <ul className="text-muted-foreground mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
                {legend.map((item) => (
                    <li key={item.name} className="flex items-center gap-1.5">
                        <span
                            aria-hidden="true"
                            className="size-2.5 shrink-0 rounded-sm"
                            style={{ background: item.fill }}
                        />
                        {item.name}
                    </li>
                ))}
            </ul>
        </div>
    );
}
