import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
    it('renders a decorative placeholder hidden from assistive tech', () => {
        const { container } = render(<Skeleton className="h-4 w-20" />);

        const placeholder = container.firstChild as HTMLElement;
        expect(placeholder).toHaveAttribute('aria-hidden', 'true');
        expect(placeholder.className).toContain('animate-pulse');
        expect(placeholder.className).toContain('h-4');
    });

    it('lets a passed-in rounded-* class override the default rounded-md', () => {
        const { container } = render(<Skeleton className="rounded-full" />);

        const placeholder = container.firstChild as HTMLElement;
        expect(placeholder.className).toContain('rounded-full');
        expect(placeholder.className).not.toContain('rounded-md');
    });
});
