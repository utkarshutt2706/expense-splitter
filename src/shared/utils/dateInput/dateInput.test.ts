import { describe, expect, it, vi } from 'vitest';

import { localDateInputValue, normalizeDateInputValue, openDatePicker } from './dateInput';

describe('localDateInputValue', () => {
    it('formats the calendar date in the local timezone', () => {
        const date = new Date('2026-08-30T18:30:00.000Z');
        vi.spyOn(date, 'getTimezoneOffset').mockReturnValue(-330);

        expect(localDateInputValue(date)).toBe('2026-08-31');
    });

    it('handles a timezone behind UTC without changing the instant supplied by the caller', () => {
        const date = new Date('2026-08-31T02:30:00.000Z');
        vi.spyOn(date, 'getTimezoneOffset').mockReturnValue(300);

        expect(localDateInputValue(date)).toBe('2026-08-30');
        expect(date.toISOString()).toBe('2026-08-31T02:30:00.000Z');
    });
});

describe('normalizeDateInputValue', () => {
    it('extracts the date accepted by an HTML date input from an ISO timestamp', () => {
        expect(normalizeDateInputValue('2026-08-30T12:45:00.000Z')).toBe('2026-08-30');
    });

    it('preserves an absent optional date', () => {
        expect(normalizeDateInputValue()).toBeUndefined();
    });

    it.each(['', '2026-08-30'])('preserves the already-normalized value %j', (value) => {
        expect(normalizeDateInputValue(value)).toBe(value);
    });
});

describe('openDatePicker', () => {
    it('opens the native picker when the browser supports it', () => {
        const input = document.createElement('input');
        const showPicker = vi.fn();
        input.showPicker = showPicker;

        openDatePicker(input);

        expect(showPicker).toHaveBeenCalledOnce();
    });

    it('falls back without throwing when showPicker is unavailable', () => {
        const input = document.createElement('input');

        expect(() => openDatePicker(input)).not.toThrow();
    });

    it('falls back without throwing when the browser restricts programmatic opening', () => {
        const input = document.createElement('input');
        input.showPicker = vi.fn(() => {
            throw new DOMException('Not allowed', 'NotAllowedError');
        });

        expect(() => openDatePicker(input)).not.toThrow();
    });
});
