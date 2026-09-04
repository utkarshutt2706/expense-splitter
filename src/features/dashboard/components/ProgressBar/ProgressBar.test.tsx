import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
    it.each([
        ['brand', 'bg-brand-600'],
        ['amber', 'bg-amber-300'],
    ] as const)('renders percentage and %s variant', (variant, fillClass) => {
        const { container } = render(
            <ProgressBar percentage={37.5} variant={variant} className="extra" />,
        );
        const track = container.firstElementChild;
        const fill = track?.firstElementChild;
        expect(track).toHaveClass('extra');
        expect(fill).toHaveClass(fillClass);
        expect(fill).toHaveStyle({ width: '37.5%' });
    });
});
