import * as Popover from '@radix-ui/react-popover';
import { render, screen } from '@testing-library/react';
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
});
