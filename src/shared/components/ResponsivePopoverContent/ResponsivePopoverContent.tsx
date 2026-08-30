import * as Popover from '@radix-ui/react-popover';
import { forwardRef } from 'react';

import { cn } from '@shared/utils';

export const ResponsivePopoverContent = forwardRef<
    React.ComponentRef<typeof Popover.Content>,
    React.ComponentPropsWithoutRef<typeof Popover.Content>
>(({ className, collisionPadding = 8, ...props }, ref) => (
    <Popover.Content
        ref={ref}
        collisionPadding={collisionPadding}
        className={cn(
            'max-h-[var(--radix-popover-content-available-height)] overflow-y-auto overscroll-contain',
            className,
        )}
        {...props}
    />
));

ResponsivePopoverContent.displayName = 'ResponsivePopoverContent';
