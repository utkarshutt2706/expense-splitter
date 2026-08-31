import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { useSwipeableRow } from '@shared/hooks';
import { cn } from '@shared/utils';

export interface SwipeAction {
    readonly key: string;
    readonly label: string;
    readonly icon: LucideIcon;
    readonly onClick: () => void;
    readonly tone?: 'default' | 'destructive';
    readonly disabled?: boolean;
    readonly title?: string;
}

export type SwipeableRowProps = Readonly<{
    actions: SwipeAction[];
    children: ReactNode;
    className?: string;
}>;

export function SwipeableRow({ actions, children, className }: SwipeableRowProps) {
    const {
        actionWidth,
        close,
        foregroundStyle,
        handleMouseDown,
        handleRowClick,
        handleTouchEnd,
        handleTouchMove,
        handleTouchStart,
        isOpen,
        rootRef,
    } = useSwipeableRow(actions.length);

    return (
        <div ref={rootRef} className={cn('relative overflow-hidden rounded-lg', className)}>
            <div className="absolute inset-y-0 right-0 flex" aria-hidden={!isOpen}>
                {actions.map((action) => (
                    <button
                        key={action.key}
                        type="button"
                        title={action.title ?? action.label}
                        aria-label={action.label}
                        disabled={action.disabled}
                        tabIndex={isOpen ? undefined : -1}
                        onClick={() => {
                            action.onClick();
                            close();
                        }}
                        style={{ width: actionWidth }}
                        className={cn(
                            'flex cursor-pointer flex-col items-center justify-center gap-1 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60',
                            action.tone === 'destructive' ? 'bg-red-600' : 'bg-brand-600',
                        )}
                    >
                        <action.icon className="size-4" />
                        {action.label}
                    </button>
                ))}
            </div>

            {/* Dragging is a supplementary pointer shortcut. Each revealed action remains a real button, while interactive row content remains independently keyboard accessible. */}
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
            <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onClickCapture={handleRowClick}
                style={foregroundStyle}
                className="bg-surface relative"
            >
                {children}
            </div>
        </div>
    );
}
