export function getInitials(name: string): string | null {
    const words = name.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) {
        return null;
    }

    const first = words[0]!.charAt(0);
    const last = words[words.length - 1]!.charAt(0);

    return (words.length === 1 ? first : first + last).toUpperCase();
}
