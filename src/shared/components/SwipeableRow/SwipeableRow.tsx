import type { LucideIcon } from 'lucide-react';
import {
    useEffect,
    useRef,
    useState,
    type MouseEvent as ReactMouseEvent,
    type ReactNode,
    type TouchEvent as ReactTouchEvent,
} from 'react';

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

type SwipeableRowProps = Readonly<{
    actions: SwipeAction[];
    children: ReactNode;
    className?: string;
}>;

const ACTION_WIDTH = 64;
// A press must move at least this far horizontally before it's treated as the
// start of a drag, so an ordinary tap/click on the row (or something inside
// it, like a link) isn't hijacked.
const DRAG_THRESHOLD = 8;

// A generic drag-to-reveal wrapper (iOS Mail-style): dragging the row left
// reveals `actions` underneath it — via a touch swipe, or via a mouse
// click-and-hold-drag, so it works the same way regardless of input device.
export function SwipeableRow({ actions, children, className }: SwipeableRowProps) {
    const [offset, setOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchDrag = useRef<{ startX: number; startOffset: number; isDragging: boolean } | null>(
        null,
    );
    // A mousedown+mouseup (or touchstart+touchend) pair on the same element always
    // fires a native `click` afterwards, regardless of how far the pointer moved in
    // between — unlike touch, mouse browsers don't suppress it just because a drag
    // happened. Without tracking this, that trailing click gets read as "the row is
    // open, so this tap must mean close it," undoing the drag the instant it finishes.
    const justDragged = useRef(false);
    const rootRef = useRef<HTMLDivElement>(null);

    const maxOffset = -(actions.length * ACTION_WIDTH);
    const clamp = (value: number) => Math.min(0, Math.max(maxOffset, value));
    const snap = (current: number) => (current < maxOffset / 2 ? maxOffset : 0);

    // Clicking/tapping anywhere outside this row — another row, the rest of the
    // page — should close it, not just clicking the row's own content.
    useEffect(() => {
        if (offset === 0) return undefined;

        const closeIfOutside = (event: MouseEvent | TouchEvent) => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                setOffset(0);
            }
        };

        document.addEventListener('mousedown', closeIfOutside);
        document.addEventListener('touchstart', closeIfOutside);
        return () => {
            document.removeEventListener('mousedown', closeIfOutside);
            document.removeEventListener('touchstart', closeIfOutside);
        };
    }, [offset]);

    function markDragFinished() {
        justDragged.current = true;
        // A safety net, not the primary mechanism — the trailing click (if the
        // browser fires one) arrives synchronously before this runs, so this only
        // exists to un-stick the flag if no click shows up at all.
        setTimeout(() => {
            justDragged.current = false;
        }, 0);
    }

    const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
        const touch = event.touches[0];
        if (!touch) return;
        touchDrag.current = { startX: touch.clientX, startOffset: offset, isDragging: false };
    };

    const handleTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
        const touch = event.touches[0];
        const drag = touchDrag.current;
        if (!touch || !drag) return;

        const deltaX = touch.clientX - drag.startX;
        if (!drag.isDragging && Math.abs(deltaX) < DRAG_THRESHOLD) return;

        if (!drag.isDragging) {
            drag.isDragging = true;
            setIsDragging(true);
        }
        setOffset(clamp(drag.startOffset + deltaX));
    };

    const handleTouchEnd = () => {
        const drag = touchDrag.current;
        touchDrag.current = null;
        if (!drag?.isDragging) return;

        markDragFinished();
        setIsDragging(false);
        setOffset(snap);
    };

    // Mouse dragging needs to keep tracking even once the cursor leaves this
    // element's bounds, which touchmove/touchend do natively but mousemove/
    // mouseup don't — so the drag session is followed on `window` instead,
    // for exactly as long as the button stays held.
    const handleMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;

        // Without this, the browser's own text-selection/native-link-drag kicks in
        // as soon as the mouse moves, fighting the transform below for every frame
        // — the visible symptom is a drag that looks laggy or just doesn't track
        // the cursor properly, not a dropped event or a missing case.
        event.preventDefault();

        const startX = event.clientX;
        const startOffset = offset;
        let dragging = false;

        const handleWindowMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            if (!dragging && Math.abs(deltaX) < DRAG_THRESHOLD) return;

            if (!dragging) {
                dragging = true;
                setIsDragging(true);
            }
            setOffset(clamp(startOffset + deltaX));
        };

        const handleWindowMouseUp = () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
            if (!dragging) return;

            markDragFinished();
            setIsDragging(false);
            setOffset(snap);
        };

        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('mouseup', handleWindowMouseUp);
    };

    const handleRowClick = (event: ReactMouseEvent<HTMLDivElement>) => {
        if (justDragged.current) {
            justDragged.current = false;
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        if (offset === 0) return;
        event.preventDefault();
        event.stopPropagation();
        setOffset(0);
    };

    return (
        <div ref={rootRef} className={cn('relative overflow-hidden rounded-lg', className)}>
            <div className="absolute inset-y-0 right-0 flex" aria-hidden={offset === 0}>
                {actions.map((action) => (
                    <button
                        key={action.key}
                        type="button"
                        title={action.title ?? action.label}
                        aria-label={action.label}
                        disabled={action.disabled}
                        tabIndex={offset === 0 ? -1 : undefined}
                        onClick={() => {
                            action.onClick();
                            setOffset(0);
                        }}
                        style={{ width: ACTION_WIDTH }}
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

            {/* Drag-to-reveal is a supplementary quick action, not the only way to reach
                edit/delete — every action is a real <button> once revealed, and the row's
                own content (e.g. a Link to the detail page) remains independently reachable
                by keyboard; there's no keyboard-equivalent trigger for the drag gesture
                itself, hence the targeted rule exception below. */}
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
            <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onClickCapture={handleRowClick}
                style={{
                    transform: `translateX(${offset}px)`,
                    transition: isDragging ? 'none' : 'transform 200ms ease-out',
                    userSelect: isDragging ? 'none' : undefined,
                }}
                className="bg-surface relative"
            >
                {children}
            </div>
        </div>
    );
}
