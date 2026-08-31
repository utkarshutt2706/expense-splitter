import {
    useEffect,
    useRef,
    useState,
    type MouseEvent as ReactMouseEvent,
    type TouchEvent as ReactTouchEvent,
} from 'react';

const ACTION_WIDTH = 64;
const DRAG_THRESHOLD = 8;

export function useSwipeableRow(actionCount: number) {
    const [offset, setOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchDrag = useRef<{ startX: number; startOffset: number; isDragging: boolean } | null>(
        null,
    );
    const justDragged = useRef(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const maxOffset = -(actionCount * ACTION_WIDTH);
    const clamp = (value: number) => Math.min(0, Math.max(maxOffset, value));
    const snap = (current: number) => (current < maxOffset / 2 ? maxOffset : 0);
    const close = () => setOffset(0);

    useEffect(() => {
        if (offset === 0) return undefined;
        const closeIfOutside = (event: MouseEvent | TouchEvent) => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) close();
        };
        document.addEventListener('mousedown', closeIfOutside);
        document.addEventListener('touchstart', closeIfOutside);
        return () => {
            document.removeEventListener('mousedown', closeIfOutside);
            document.removeEventListener('touchstart', closeIfOutside);
        };
    }, [offset]);

    const markDragFinished = () => {
        justDragged.current = true;
        setTimeout(() => {
            justDragged.current = false;
        }, 0);
    };

    const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
        const touch = event.touches[0];
        if (touch) {
            touchDrag.current = { startX: touch.clientX, startOffset: offset, isDragging: false };
        }
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

    const handleMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
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
        close();
    };

    return {
        actionWidth: ACTION_WIDTH,
        close,
        foregroundStyle: {
            transform: `translateX(${offset}px)`,
            transition: isDragging ? 'none' : 'transform 200ms ease-out',
            userSelect: isDragging ? ('none' as const) : undefined,
        },
        handleMouseDown,
        handleRowClick,
        handleTouchEnd,
        handleTouchMove,
        handleTouchStart,
        isOpen: offset !== 0,
        rootRef,
    };
}
