import { Sector, type PieSectorShapeProps } from 'recharts';
import { ANALYTICS_CHART_COLORS } from '@features/analytics/utils';

export function ColoredPieSector(props: PieSectorShapeProps) {
    return (
        <Sector
            {...props}
            fill={
                props.payload?.fill ??
                ANALYTICS_CHART_COLORS[props.index % ANALYTICS_CHART_COLORS.length]
            }
        />
    );
}
