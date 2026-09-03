import { useState, type CSSProperties } from 'react';

export type SettlementCelebration = 'personal' | 'group';

const CONFETTI_COLORS = ['#c2410c', '#ea580c', '#f97316', '#f59e0b', '#d6a15d'];

function shouldCelebrate(groupId: string, celebration: SettlementCelebration): boolean {
    if (
        typeof window === 'undefined' ||
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
        return false;
    }
    const key = `expense-splitter:settlement-celebrated:${groupId}:${celebration}`;
    try {
        if (window.sessionStorage.getItem(key)) return false;
        window.sessionStorage.setItem(key, 'true');
        return true;
    } catch {
        return true;
    }
}

export function SettlementConfetti({
    groupId,
    celebration,
}: Readonly<{ groupId: string; celebration: SettlementCelebration }>) {
    const [visible, setVisible] = useState(() => shouldCelebrate(groupId, celebration));
    if (!visible) return null;
    const particleCount = celebration === 'group' ? 18 : 12;
    return (
        <span
            aria-hidden="true"
            data-testid={`${celebration}-settlement-confetti`}
            onAnimationEnd={() => setVisible(false)}
            className="settlement-confetti pointer-events-none fixed inset-0 z-40 overflow-hidden"
        >
            {Array.from({ length: particleCount }, (_, index) => (
                <span
                    key={index}
                    className="settlement-confetti__particle"
                    style={
                        {
                            '--confetti-color': CONFETTI_COLORS[index % CONFETTI_COLORS.length],
                            '--confetti-delay': `${(index % 6) * 70}ms`,
                            '--confetti-left': `${8 + ((index * 47) % 84)}%`,
                            '--confetti-rotation': `${90 + ((index * 53) % 240)}deg`,
                        } as CSSProperties
                    }
                />
            ))}
        </span>
    );
}
