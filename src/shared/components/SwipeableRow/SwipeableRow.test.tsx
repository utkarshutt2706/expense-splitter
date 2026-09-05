import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pencil, Trash2 } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { SwipeableRow, type SwipeAction } from './SwipeableRow';

function touch(clientX: number) {
    return { touches: [{ clientX }] };
}

function makeActions(overrides: Partial<SwipeAction> = {}): SwipeAction[] {
    return [
        { key: 'edit', label: 'Edit', icon: Pencil, onClick: vi.fn(), ...overrides },
        { key: 'delete', label: 'Delete', icon: Trash2, tone: 'destructive', onClick: vi.fn() },
    ];
}

describe('SwipeableRow', () => {
    it('renders its children', () => {
        render(
            <SwipeableRow actions={makeActions()}>
                <p>Row content</p>
            </SwipeableRow>,
        );

        expect(screen.getByText('Row content')).toBeInTheDocument();
    });

    it('keeps the actions layer hidden from assistive tech until swiped open', () => {
        const { container } = render(
            <SwipeableRow actions={makeActions()}>
                <p>Row content</p>
            </SwipeableRow>,
        );

        expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Edit', hidden: true })).toHaveAttribute(
            'tabindex',
            '-1',
        );
    });

    it('applies action widths, tones, title fallbacks, and a custom row class', () => {
        const actions = makeActions();
        actions[1] = { ...actions[1]!, title: 'Permanently delete' };
        const { container } = render(
            <SwipeableRow actions={actions} className="rounded-none">
                <p>Row content</p>
            </SwipeableRow>,
        );

        expect(container.firstChild).toHaveClass('rounded-none');
        expect(screen.getByRole('button', { name: 'Edit', hidden: true })).toHaveAttribute(
            'title',
            'Edit',
        );
        expect(screen.getByRole('button', { name: 'Edit', hidden: true })).toHaveStyle({
            width: '64px',
        });
        expect(screen.getByRole('button', { name: 'Edit', hidden: true })).toHaveClass(
            'bg-brand-600',
        );
        expect(screen.getByRole('button', { name: 'Delete', hidden: true })).toHaveAttribute(
            'title',
            'Permanently delete',
        );
        expect(screen.getByRole('button', { name: 'Delete', hidden: true })).toHaveClass(
            'bg-red-600',
        );
    });

    it('supports a row with no actions', () => {
        render(
            <SwipeableRow actions={[]}>
                <p>Row content</p>
            </SwipeableRow>,
        );

        expect(screen.getByText('Row content')).toBeInTheDocument();
        expect(screen.queryAllByRole('button', { hidden: true })).toHaveLength(0);
    });

    it('does not reveal actions for a small movement below the drag threshold', () => {
        const { container } = render(
            <SwipeableRow actions={makeActions()}>
                <p>Row content</p>
            </SwipeableRow>,
        );
        const foreground = screen.getByText('Row content').parentElement!;

        fireEvent.touchStart(foreground, touch(100));
        fireEvent.touchMove(foreground, touch(96));
        fireEvent.touchEnd(foreground);

        expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
        expect(foreground).toHaveStyle({ transform: 'translateX(0px)' });
    });

    it('snaps open once dragged more than halfway across the actions width', () => {
        const { container } = render(
            <SwipeableRow actions={makeActions()}>
                <p>Row content</p>
            </SwipeableRow>,
        );
        const foreground = screen.getByText('Row content').parentElement!;

        fireEvent.touchStart(foreground, touch(100));
        fireEvent.touchMove(foreground, touch(20));
        fireEvent.touchEnd(foreground);

        expect(container.querySelector('[aria-hidden="false"]')).toBeInTheDocument();
        expect(foreground).toHaveStyle({ transform: 'translateX(-128px)' });
    });

    it('snaps back closed when dragged less than halfway', () => {
        const { container } = render(
            <SwipeableRow actions={makeActions()}>
                <p>Row content</p>
            </SwipeableRow>,
        );
        const foreground = screen.getByText('Row content').parentElement!;

        fireEvent.touchStart(foreground, touch(100));
        fireEvent.touchMove(foreground, touch(85));
        fireEvent.touchEnd(foreground);

        expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
        expect(foreground).toHaveStyle({ transform: 'translateX(0px)' });
    });

    it('settles the row when the browser cancels an active touch gesture', () => {
        const { container } = render(
            <SwipeableRow actions={makeActions()}>
                <p>Row content</p>
            </SwipeableRow>,
        );
        const foreground = screen.getByText('Row content').parentElement!;

        fireEvent.touchStart(foreground, touch(100));
        fireEvent.touchMove(foreground, touch(20));
        fireEvent.touchCancel(foreground);

        expect(container.querySelector('[aria-hidden="false"]')).toBeInTheDocument();
        expect(foreground).toHaveStyle({ transform: 'translateX(-128px)' });
        expect(foreground).not.toHaveStyle({ userSelect: 'none' });
    });

    it('calls the action handler and closes when an action button is clicked', async () => {
        const user = userEvent.setup();
        const onEdit = vi.fn();
        const { container } = render(
            <SwipeableRow actions={makeActions({ onClick: onEdit })}>
                <p>Row content</p>
            </SwipeableRow>,
        );
        const foreground = screen.getByText('Row content').parentElement!;

        fireEvent.touchStart(foreground, touch(100));
        fireEvent.touchMove(foreground, touch(20));
        fireEvent.touchEnd(foreground);

        await user.click(screen.getByRole('button', { name: 'Edit' }));

        expect(onEdit).toHaveBeenCalledOnce();
        expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });

    it('stays open through the browser-fired click that trails a completed drag', () => {
        const innerClick = vi.fn();
        const { container } = render(
            <SwipeableRow actions={makeActions()}>
                <button type="button" onClick={innerClick}>
                    Row content
                </button>
            </SwipeableRow>,
        );
        const foreground = screen.getByText('Row content').parentElement!;

        fireEvent.touchStart(foreground, touch(100));
        fireEvent.touchMove(foreground, touch(20));
        fireEvent.touchEnd(foreground);

        // A touchend/mouseup on the same element the press started on always
        // fires a native click afterwards, regardless of how far it dragged —
        // this must not be read as a deliberate tap-to-close, or the row would
        // never actually stay open after a drag.
        fireEvent.click(screen.getByText('Row content'));

        expect(innerClick).not.toHaveBeenCalled();
        expect(container.querySelector('[aria-hidden="false"]')).toBeInTheDocument();
    });

    it('closes on a genuine subsequent tap instead of letting the click reach the row content', () => {
        const innerClick = vi.fn();
        const { container } = render(
            <SwipeableRow actions={makeActions()}>
                <button type="button" onClick={innerClick}>
                    Row content
                </button>
            </SwipeableRow>,
        );
        const foreground = screen.getByText('Row content').parentElement!;

        fireEvent.touchStart(foreground, touch(100));
        fireEvent.touchMove(foreground, touch(20));
        fireEvent.touchEnd(foreground);
        fireEvent.click(screen.getByText('Row content')); // the drag's own trailing click

        fireEvent.click(screen.getByText('Row content')); // a real, separate tap

        expect(innerClick).not.toHaveBeenCalled();
        expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });

    it('disables an action button when marked disabled', () => {
        render(
            <SwipeableRow actions={makeActions({ disabled: true })}>
                <p>Row content</p>
            </SwipeableRow>,
        );
        const foreground = screen.getByText('Row content').parentElement!;

        fireEvent.touchStart(foreground, touch(100));
        fireEvent.touchMove(foreground, touch(20));
        fireEvent.touchEnd(foreground);

        expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled();
    });

    it('gives the action buttons a pointer cursor', () => {
        render(
            <SwipeableRow actions={makeActions()}>
                <p>Row content</p>
            </SwipeableRow>,
        );
        const foreground = screen.getByText('Row content').parentElement!;

        fireEvent.touchStart(foreground, touch(100));
        fireEvent.touchMove(foreground, touch(20));
        fireEvent.touchEnd(foreground);

        expect(screen.getByRole('button', { name: 'Edit' })).toHaveClass('cursor-pointer');
        expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('cursor-pointer');
    });

    it('closes when a click lands outside the row entirely, not just outside the row itself', () => {
        const { container } = render(
            <div>
                <SwipeableRow actions={makeActions()}>
                    <p>Row content</p>
                </SwipeableRow>
                <button type="button">Somewhere else on the page</button>
            </div>,
        );
        const foreground = screen.getByText('Row content').parentElement!;

        fireEvent.touchStart(foreground, touch(100));
        fireEvent.touchMove(foreground, touch(20));
        fireEvent.touchEnd(foreground);

        expect(container.querySelector('[aria-hidden="false"]')).toBeInTheDocument();

        fireEvent.mouseDown(screen.getByText('Somewhere else on the page'));

        expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });

    it('does nothing when the row is already closed and a click lands elsewhere', () => {
        const { container } = render(
            <div>
                <SwipeableRow actions={makeActions()}>
                    <p>Row content</p>
                </SwipeableRow>
                <button type="button">Somewhere else on the page</button>
            </div>,
        );

        fireEvent.mouseDown(screen.getByText('Somewhere else on the page'));

        expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });

    describe('mouse click-and-hold-drag (desktop equivalent of the touch swipe)', () => {
        it('prevents the default browser action on mousedown, so text selection and native link-drag do not fight the drag', () => {
            render(
                <SwipeableRow actions={makeActions()}>
                    <p>Row content</p>
                </SwipeableRow>,
            );
            const foreground = screen.getByText('Row content').parentElement!;

            const mouseDownEvent = new MouseEvent('mousedown', {
                bubbles: true,
                cancelable: true,
                clientX: 100,
            });
            foreground.dispatchEvent(mouseDownEvent);

            expect(mouseDownEvent.defaultPrevented).toBe(true);
        });

        it('marks the row non-selectable only while an actual drag is in progress', () => {
            render(
                <SwipeableRow actions={makeActions()}>
                    <p>Row content</p>
                </SwipeableRow>,
            );
            const foreground = screen.getByText('Row content').parentElement as HTMLElement;

            expect(foreground.style.userSelect).toBe('');

            fireEvent.mouseDown(foreground, { clientX: 100 });
            fireEvent.mouseMove(window, { clientX: 20 });

            expect(foreground.style.userSelect).toBe('none');

            fireEvent.mouseUp(window);

            expect(foreground.style.userSelect).toBe('');
        });

        it('does not reveal actions for a small movement below the drag threshold', () => {
            const { container } = render(
                <SwipeableRow actions={makeActions()}>
                    <p>Row content</p>
                </SwipeableRow>,
            );
            const foreground = screen.getByText('Row content').parentElement!;

            fireEvent.mouseDown(foreground, { clientX: 100 });
            fireEvent.mouseMove(window, { clientX: 96 });
            fireEvent.mouseUp(window);

            expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
            expect(foreground).toHaveStyle({ transform: 'translateX(0px)' });
        });

        it('snaps open once dragged more than halfway across the actions width', () => {
            const { container } = render(
                <SwipeableRow actions={makeActions()}>
                    <p>Row content</p>
                </SwipeableRow>,
            );
            const foreground = screen.getByText('Row content').parentElement!;

            fireEvent.mouseDown(foreground, { clientX: 100 });
            fireEvent.mouseMove(window, { clientX: 20 });
            fireEvent.mouseUp(window);

            expect(container.querySelector('[aria-hidden="false"]')).toBeInTheDocument();
            expect(foreground).toHaveStyle({ transform: 'translateX(-128px)' });
        });

        it('snaps back closed when dragged less than halfway', () => {
            const { container } = render(
                <SwipeableRow actions={makeActions()}>
                    <p>Row content</p>
                </SwipeableRow>,
            );
            const foreground = screen.getByText('Row content').parentElement!;

            fireEvent.mouseDown(foreground, { clientX: 100 });
            fireEvent.mouseMove(window, { clientX: 85 });
            fireEvent.mouseUp(window);

            expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
            expect(foreground).toHaveStyle({ transform: 'translateX(0px)' });
        });

        it('ignores a non-left-button press', () => {
            const { container } = render(
                <SwipeableRow actions={makeActions()}>
                    <p>Row content</p>
                </SwipeableRow>,
            );
            const foreground = screen.getByText('Row content').parentElement!;

            fireEvent.mouseDown(foreground, { clientX: 100, button: 2 });
            fireEvent.mouseMove(window, { clientX: 20 });
            fireEvent.mouseUp(window);

            expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
            expect(foreground).toHaveStyle({ transform: 'translateX(0px)' });
        });

        it('stops tracking mouse movement once the button is released', () => {
            const { container } = render(
                <SwipeableRow actions={makeActions()}>
                    <p>Row content</p>
                </SwipeableRow>,
            );
            const foreground = screen.getByText('Row content').parentElement!;

            fireEvent.mouseDown(foreground, { clientX: 100 });
            fireEvent.mouseMove(window, { clientX: 20 });
            fireEvent.mouseUp(window);
            fireEvent.mouseMove(window, { clientX: 100 });

            expect(container.querySelector('[aria-hidden="false"]')).toBeInTheDocument();
            expect(foreground).toHaveStyle({ transform: 'translateX(-128px)' });
        });

        it('stays open through the browser-fired click that trails a completed drag', () => {
            const innerClick = vi.fn();
            const { container } = render(
                <SwipeableRow actions={makeActions()}>
                    <button type="button" onClick={innerClick}>
                        Row content
                    </button>
                </SwipeableRow>,
            );
            const foreground = screen.getByText('Row content').parentElement!;

            fireEvent.mouseDown(foreground, { clientX: 100 });
            fireEvent.mouseMove(window, { clientX: 20 });
            fireEvent.mouseUp(window);

            // Same as the touch case: mousedown+mouseup on the same element
            // fires a trailing click regardless of how far it dragged.
            fireEvent.click(screen.getByText('Row content'));

            expect(innerClick).not.toHaveBeenCalled();
            expect(container.querySelector('[aria-hidden="false"]')).toBeInTheDocument();
        });
    });
});
