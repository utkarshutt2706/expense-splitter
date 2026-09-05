import * as Popover from '@radix-ui/react-popover';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { ResponsivePopoverContent } from './ResponsivePopoverContent';

describe('ResponsivePopoverContent', () => {
    it('constrains itself to the available viewport height and scrolls overflow', () => {
        render(
            <Popover.Root open>
                <Popover.Anchor>Anchor</Popover.Anchor>
                <ResponsivePopoverContent data-testid="popover">Content</ResponsivePopoverContent>
            </Popover.Root>,
        );

        expect(screen.getByTestId('popover')).toHaveClass(
            'max-h-[var(--radix-popover-content-available-height)]',
            'overflow-y-auto',
            'overscroll-contain',
        );
    });

    it('forwards its ref, custom classes, and content props with custom collision padding', () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <Popover.Root open>
                <Popover.Anchor>Anchor</Popover.Anchor>
                <ResponsivePopoverContent
                    ref={ref}
                    collisionPadding={24}
                    className="w-72"
                    data-testid="popover"
                    aria-label="Options"
                >
                    Content
                </ResponsivePopoverContent>
            </Popover.Root>,
        );

        expect(ref.current).toBe(screen.getByTestId('popover'));
        expect(ref.current).toHaveClass('w-72', 'overflow-y-auto');
        expect(ref.current).toHaveAccessibleName('Options');
    });
});
