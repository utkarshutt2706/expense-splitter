import { render } from '@testing-library/react';
import type { PieSectorShapeProps } from 'recharts';
import { describe, expect, it, vi } from 'vitest';

import { ANALYTICS_CHART_COLORS } from '@features/analytics/utils';
import { ColoredPieSector } from './ColoredPieSector';

const sector = vi.hoisted(() => vi.fn());
vi.mock('recharts', () => ({ Sector: (props: unknown) => (sector(props), null) }));

describe('ColoredPieSector', () => {
    const coordinates = {
        cx: 50,
        cy: 50,
        innerRadius: 0,
        outerRadius: 40,
        maxRadius: 50,
        startAngle: 0,
        endAngle: 90,
        value: 10,
        cornerRadius: undefined,
    } as PieSectorShapeProps;

    it('prefers a color supplied by the datum', () => {
        render(<ColoredPieSector {...coordinates} index={2} payload={{ fill: 'tomato' }} />);
        expect(sector).toHaveBeenLastCalledWith(
            expect.objectContaining({ fill: 'tomato', index: 2 }),
        );
    });

    it('cycles through the analytics palette when no datum color is supplied', () => {
        const index = ANALYTICS_CHART_COLORS.length + 1;
        render(<ColoredPieSector {...coordinates} index={index} />);
        expect(sector).toHaveBeenLastCalledWith(
            expect.objectContaining({ fill: ANALYTICS_CHART_COLORS[1], index }),
        );
    });
});
