export function localDateInputValue(date: Date): string {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function normalizeDateInputValue(value?: string): string | undefined {
    return value?.slice(0, 10);
}

export function openDatePicker(input: HTMLInputElement): void {
    try {
        input.showPicker?.();
    } catch {
        // Fall back to the browser's normal date-input behavior when restricted.
    }
}
