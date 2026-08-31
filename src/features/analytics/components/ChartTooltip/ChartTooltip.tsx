import { Tooltip } from 'recharts';
import { ANALYTICS_CHART_TOOLTIP_STYLE } from '@features/analytics/utils';
import { formatCurrency } from '@shared/utils';

export type ChartTooltipProps = Readonly<{ showLabel?: boolean }>;
export function ChartTooltip({ showLabel = false }: ChartTooltipProps) {
    return (
        <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            labelFormatter={
                showLabel ? (label, payload) => payload[0]?.payload?.fullName ?? label : undefined
            }
            contentStyle={ANALYTICS_CHART_TOOLTIP_STYLE}
        />
    );
}
