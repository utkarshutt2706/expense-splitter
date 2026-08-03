const PHONE_DIGITS = 10;

// Strips anything that isn't a digit as the user types, and caps the length —
// used as a live input sanitizer, not just end-of-form validation.
export function sanitizePhoneInput(value: string): string {
    return value.replace(/\D/g, '').slice(0, PHONE_DIGITS);
}
