import { describe, expect, it, vi } from 'vitest';

import { closeOnSubmit } from './closeOnSubmit';

describe('closeOnSubmit', () => {
    it('closes the dialog and forwards the values on submit', () => {
        const onOpenChange = vi.fn();
        const onSubmit = vi.fn();

        const handlers = closeOnSubmit(onOpenChange, onSubmit);
        handlers.onSubmit({ name: 'Priya Sharma' });

        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(onSubmit).toHaveBeenCalledWith({ name: 'Priya Sharma' });
        expect(onOpenChange.mock.invocationCallOrder[0]).toBeLessThan(
            onSubmit.mock.invocationCallOrder[0]!,
        );
    });

    it('closes the dialog on cancel without calling onSubmit', () => {
        const onOpenChange = vi.fn();
        const onSubmit = vi.fn();

        const handlers = closeOnSubmit(onOpenChange, onSubmit);
        handlers.onCancel();

        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('propagates submission failures after closing the dialog', () => {
        const onOpenChange = vi.fn();
        const failure = new Error('submission failed');
        const handlers = closeOnSubmit(onOpenChange, () => {
            throw failure;
        });

        expect(() => handlers.onSubmit('values')).toThrow(failure);
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('does not submit when closing itself fails', () => {
        const onSubmit = vi.fn();
        const failure = new Error('close failed');
        const handlers = closeOnSubmit(() => {
            throw failure;
        }, onSubmit);

        expect(() => handlers.onSubmit('values')).toThrow(failure);
        expect(onSubmit).not.toHaveBeenCalled();
    });
});
