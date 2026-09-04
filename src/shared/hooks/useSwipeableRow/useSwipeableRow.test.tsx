import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSwipeableRow } from './useSwipeableRow';

function touchEvent(clientX?: number) {
    return {
        touches: clientX === undefined ? [] : [{ clientX }],
    } as unknown as React.TouchEvent<HTMLDivElement>;
}

function mouseEvent(clientX: number, button = 0) {
    return {
        button,
        clientX,
        preventDefault: vi.fn(),
    } as unknown as React.MouseEvent<HTMLDivElement>;
}

describe('useSwipeableRow', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('initializes closed with action dimensions and transition styles', () => {
        const { result } = renderHook(() => useSwipeableRow(2));

        expect(result.current.actionWidth).toBe(64);
        expect(result.current.isOpen).toBe(false);
        expect(result.current.foregroundStyle).toEqual({
            transform: 'translateX(0px)',
            transition: 'transform 200ms ease-out',
            userSelect: undefined,
        });
    });

    it('ignores incomplete and below-threshold touches', () => {
        const { result } = renderHook(() => useSwipeableRow(2));

        act(() => result.current.handleTouchStart(touchEvent()));
        act(() => result.current.handleTouchMove(touchEvent(20)));
        act(() => result.current.handleTouchEnd());
        act(() => result.current.handleTouchStart(touchEvent(100)));
        act(() => result.current.handleTouchMove(touchEvent(94)));
        act(() => result.current.handleTouchEnd());

        expect(result.current.isOpen).toBe(false);
        expect(result.current.foregroundStyle.transform).toBe('translateX(0px)');
    });

    it('clamps touch dragging and snaps according to the halfway point', () => {
        const { result } = renderHook(() => useSwipeableRow(2));

        act(() => result.current.handleTouchStart(touchEvent(100)));
        act(() => result.current.handleTouchMove(touchEvent(-100)));
        expect(result.current.foregroundStyle).toMatchObject({
            transform: 'translateX(-128px)',
            transition: 'none',
            userSelect: 'none',
        });
        act(() => result.current.handleTouchEnd());
        expect(result.current.isOpen).toBe(true);

        act(() => result.current.handleTouchStart(touchEvent(0)));
        act(() => result.current.handleTouchMove(touchEvent(200)));
        expect(result.current.foregroundStyle.transform).toBe('translateX(0px)');
        act(() => result.current.handleTouchEnd());
        expect(result.current.isOpen).toBe(false);
    });

    it('supports left-button mouse dragging and stops tracking after release', () => {
        const { result } = renderHook(() => useSwipeableRow(2));
        const down = mouseEvent(100);

        act(() => result.current.handleMouseDown(down));
        expect(down.preventDefault).toHaveBeenCalledOnce();
        act(() => window.dispatchEvent(new MouseEvent('mousemove', { clientX: 20 })));
        expect(result.current.foregroundStyle.userSelect).toBe('none');
        act(() => window.dispatchEvent(new MouseEvent('mouseup')));
        expect(result.current.foregroundStyle.transform).toBe('translateX(-128px)');
        expect(result.current.foregroundStyle.userSelect).toBeUndefined();

        act(() => window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100 })));
        expect(result.current.foregroundStyle.transform).toBe('translateX(-128px)');
    });

    it('ignores non-left mouse buttons', () => {
        const { result } = renderHook(() => useSwipeableRow(1));
        const down = mouseEvent(100, 2);

        act(() => result.current.handleMouseDown(down));
        act(() => window.dispatchEvent(new MouseEvent('mousemove', { clientX: 20 })));
        act(() => window.dispatchEvent(new MouseEvent('mouseup')));

        expect(down.preventDefault).not.toHaveBeenCalled();
        expect(result.current.isOpen).toBe(false);
    });

    it('suppresses the trailing click after a drag, then closes on the next row click', () => {
        vi.useFakeTimers();
        const { result } = renderHook(() => useSwipeableRow(1));
        act(() => result.current.handleTouchStart(touchEvent(100)));
        act(() => result.current.handleTouchMove(touchEvent(20)));
        act(() => result.current.handleTouchEnd());
        const trailingClick = { preventDefault: vi.fn(), stopPropagation: vi.fn() };

        act(() =>
            result.current.handleRowClick(
                trailingClick as unknown as React.MouseEvent<HTMLDivElement>,
            ),
        );
        expect(trailingClick.preventDefault).toHaveBeenCalledOnce();
        expect(result.current.isOpen).toBe(true);

        const nextClick = { preventDefault: vi.fn(), stopPropagation: vi.fn() };
        act(() =>
            result.current.handleRowClick(nextClick as unknown as React.MouseEvent<HTMLDivElement>),
        );
        expect(nextClick.preventDefault).toHaveBeenCalledOnce();
        expect(result.current.isOpen).toBe(false);
    });

    it('closes an open row for outside mouse or touch presses but not inside presses', () => {
        const { result } = renderHook(() => useSwipeableRow(1));
        const root = document.createElement('div');
        const child = document.createElement('span');
        const outside = document.createElement('button');
        root.append(child);
        document.body.append(root, outside);
        result.current.rootRef.current = root;
        act(() => result.current.handleTouchStart(touchEvent(100)));
        act(() => result.current.handleTouchMove(touchEvent(20)));
        act(() => result.current.handleTouchEnd());

        act(() => child.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
        expect(result.current.isOpen).toBe(true);
        act(() => outside.dispatchEvent(new Event('touchstart', { bubbles: true })));
        expect(result.current.isOpen).toBe(false);

        root.remove();
        outside.remove();
    });

    it('allows direct closure and handles zero available actions', () => {
        const { result } = renderHook(() => useSwipeableRow(0));
        act(() => result.current.handleTouchStart(touchEvent(100)));
        act(() => result.current.handleTouchMove(touchEvent(0)));
        act(() => result.current.handleTouchEnd());
        expect(result.current.isOpen).toBe(false);

        act(() => result.current.close());
        expect(result.current.foregroundStyle.transform).toBe('translateX(0px)');
    });
});
