import styles from './ServerWakeGate.module.css';

export function InjuredServerIllustration() {
    return (
        <div
            className="relative flex size-24 -rotate-2 items-center justify-center"
            role="img"
            aria-label="An injured server waiting to recover"
        >
            <svg
                viewBox="0 0 112 96"
                className="drop-shadow-brand-900/15 size-full drop-shadow-md"
                aria-hidden="true"
            >
                <path
                    d="M20 18a10 10 0 0 1 10-10h52a10 10 0 0 1 10 10v58a10 10 0 0 1-10 10H30a10 10 0 0 1-10-10V18Z"
                    className="fill-surface stroke-brand-500"
                    strokeWidth="4"
                />
                <path d="M22 35h68M22 57h68" className={styles.rule} strokeWidth="3" />
                <circle cx="33" cy="22" r="4" className="fill-brand-500" />
                <circle cx="33" cy="46" r="4" className="fill-brand-400" />
                <circle cx="33" cy="69" r="4" className="fill-brand-300" />
                <g className={styles.sadEyes}>
                    <path
                        d="M49 49l5-3M67 46l5 3"
                        className="stroke-surface-foreground"
                        strokeLinecap="round"
                        strokeWidth="3"
                    />
                </g>
                <g className={styles.quiveringMouth}>
                    <path
                        d="M49 67c4-7 11-7 15 0"
                        className="stroke-surface-foreground"
                        strokeLinecap="round"
                        strokeWidth="3"
                    />
                </g>
                <g transform="rotate(-12 75 25)">
                    <rect
                        x="62"
                        y="18"
                        width="27"
                        height="13"
                        rx="6.5"
                        className="fill-amber-200 stroke-amber-500"
                        strokeWidth="2"
                    />
                    <path d="M72 20v9M78 20v9" className="stroke-amber-500" strokeWidth="1.5" />
                </g>
            </svg>
            <span
                className={`${styles.fallingTear} absolute top-[53%] left-[61%] h-4 w-2 rounded-[50%_50%_55%_55%] bg-sky-400/80`}
                aria-hidden="true"
            />
        </div>
    );
}
