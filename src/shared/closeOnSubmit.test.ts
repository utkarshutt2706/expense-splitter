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
    });

    it('closes the dialog on cancel without calling onSubmit', () => {
        const onOpenChange = vi.fn();
        const onSubmit = vi.fn();

        const handlers = closeOnSubmit(onOpenChange, onSubmit);
        handlers.onCancel();

        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(onSubmit).not.toHaveBeenCalled();
    });
});
