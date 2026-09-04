import { describe, expect, it } from 'vitest';

import {
    ANALYTICS_BAR_RADIUS,
    ANALYTICS_CHART_COLORS,
    ANALYTICS_CHART_MARGIN,
    ANALYTICS_CHART_TICK,
    ANALYTICS_CHART_TOOLTIP_STYLE,
    MIN_BAR_WIDTH,
    MIN_CATEGORY_WIDTH,
    PLOT_HEIGHT,
    VALUE_AXIS_WIDTH,
    X_AXIS_HEIGHT,
} from './analyticsChartConfig';

describe('analyticsChartConfig', () => {
    it('provides the ordered, unique chart color palette', () => {
        expect(ANALYTICS_CHART_COLORS).toEqual([
            'var(--color-brand-600)',
            'var(--color-sky-500)',
            'var(--color-emerald-500)',
            'var(--color-rose-500)',
            'var(--color-violet-500)',
            'var(--color-amber-500)',
            'var(--color-teal-500)',
            'var(--color-fuchsia-500)',
            'var(--color-lime-600)',
            'var(--color-slate-500)',
        ]);
        expect(new Set(ANALYTICS_CHART_COLORS).size).toBe(ANALYTICS_CHART_COLORS.length);
    });

    it('provides shared chart spacing and dimensions', () => {
        expect(ANALYTICS_CHART_MARGIN).toEqual({ top: 8, right: 8, bottom: 8, left: 8 });
        expect(ANALYTICS_BAR_RADIUS).toEqual([5, 5, 0, 0]);
        expect({
            MIN_CATEGORY_WIDTH,
            MIN_BAR_WIDTH,
            PLOT_HEIGHT,
            X_AXIS_HEIGHT,
            VALUE_AXIS_WIDTH,
        }).toEqual({
            MIN_CATEGORY_WIDTH: 56,
            MIN_BAR_WIDTH: 20,
            PLOT_HEIGHT: 288,
            X_AXIS_HEIGHT: 30,
            VALUE_AXIS_WIDTH: 58,
        });
    });

    it('uses theme tokens for tooltip and tick presentation', () => {
        expect(ANALYTICS_CHART_TOOLTIP_STYLE).toEqual({
            background: 'var(--surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.75rem',
            color: 'var(--surface-foreground)',
        });
        expect(ANALYTICS_CHART_TICK).toEqual({
            fill: 'var(--muted-foreground)',
            fontSize: 12,
        });
    });
});
