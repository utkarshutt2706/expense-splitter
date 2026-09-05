import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ANALYTICS_CHART_TOOLTIP_STYLE } from '@features/analytics/utils';
import { ChartTooltip } from './ChartTooltip';

const tooltip = vi.hoisted(() => vi.fn());
vi.mock('recharts', () => ({ Tooltip: (props: unknown) => (tooltip(props), null) }));

describe('ChartTooltip', () => {
    it('formats currency and applies the shared content style without a label formatter by default', () => {
        render(<ChartTooltip />);
        const props = tooltip.mock.lastCall?.[0] as Record<string, unknown>;

        expect((props.formatter as (value: number) => string)(123)).toMatch(/123/);
        expect(props.contentStyle).toEqual(ANALYTICS_CHART_TOOLTIP_STYLE);
        expect(props.labelFormatter).toBeUndefined();
    });

    it('uses a full payload name when labels are enabled and falls back to the label', () => {
        render(<ChartTooltip showLabel />);
        const formatter = (tooltip.mock.lastCall?.[0] as Record<string, unknown>)
            .labelFormatter as (
            label: string,
            payload: { payload?: { fullName?: string } }[],
        ) => string;

        expect(formatter('Aug', [{ payload: { fullName: 'August 2026' } }])).toBe('August 2026');
        expect(formatter('Aug', [])).toBe('Aug');
    });
});
