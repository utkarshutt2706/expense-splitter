import {
    ANALYTICS_CHART_MARGIN,
    PLOT_HEIGHT,
    X_AXIS_HEIGHT,
    VALUE_AXIS_WIDTH,
} from '@features/analytics/utils';
import { formatCompactCurrency } from '@shared/utils';

export type PinnedValueAxisProps = Readonly<{ ticks: number[] }>;

export function PinnedValueAxis({ ticks }: PinnedValueAxisProps) {
    const top = ticks.at(-1) ?? 0;
    const plotTop = ANALYTICS_CHART_MARGIN.top;
    const plotBottom = PLOT_HEIGHT - ANALYTICS_CHART_MARGIN.bottom - X_AXIS_HEIGHT;
    return (
        <div
            aria-hidden="true"
            className="bg-surface pointer-events-none absolute top-0 left-0 z-10"
            style={{ width: VALUE_AXIS_WIDTH, height: PLOT_HEIGHT }}
        >
            {ticks.map((tick) => (
                <span
                    key={tick}
                    className="text-muted-foreground absolute right-2 -translate-y-1/2 text-xs whitespace-nowrap"
                    style={{
                        top: plotBottom - (top === 0 ? 0 : tick / top) * (plotBottom - plotTop),
                    }}
                >
                    {formatCompactCurrency(tick)}
                </span>
            ))}
        </div>
    );
}
