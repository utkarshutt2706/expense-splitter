import { CartesianGrid, XAxis, YAxis } from 'recharts';
import { ANALYTICS_CHART_TICK, X_AXIS_HEIGHT } from '@features/analytics/utils';

export type ChartAxesProps = Readonly<{ ticks: number[] }>;
export function ChartAxes({ ticks }: ChartAxesProps) {
    return (
        <>
            <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" vertical={false} />
            <XAxis
                dataKey="name"
                height={X_AXIS_HEIGHT}
                tick={ANALYTICS_CHART_TICK}
                tickLine={false}
                axisLine={{ stroke: 'var(--border-color)' }}
            />
            <YAxis hide domain={[0, ticks.at(-1) ?? 0]} ticks={ticks} />
        </>
    );
}
