import logo from '@assets/logo.svg';

interface LogoMark {
    readonly id: string;
    readonly top: string;
    readonly left: string;
    readonly rotate: number;
    readonly size: number;
}

// Hand-placed rather than randomized on every render (which would reshuffle
// on each re-render/hydration) — a fixed, pre-jittered scatter that still
// reads as "random" without the marks ever clustering or drifting.
const LOGO_MARKS: LogoMark[] = [
    { id: 'northwest', top: '4%', left: '8%', rotate: -22, size: 44 },
    { id: 'north', top: '10%', left: '32%', rotate: 15, size: 32 },
    { id: 'north-center', top: '6%', left: '62%', rotate: 34, size: 52 },
    { id: 'northeast', top: '16%', left: '88%', rotate: -12, size: 38 },
    { id: 'west', top: '34%', left: '4%', rotate: 20, size: 36 },
    { id: 'east', top: '42%', left: '92%', rotate: -30, size: 46 },
    { id: 'southwest-center', top: '58%', left: '14%', rotate: 40, size: 40 },
    { id: 'southeast-center', top: '64%', left: '80%', rotate: -18, size: 34 },
    { id: 'southwest', top: '78%', left: '30%', rotate: 8, size: 48 },
    { id: 'south', top: '84%', left: '58%', rotate: -35, size: 30 },
    { id: 'southeast', top: '90%', left: '90%', rotate: 22, size: 40 },
    { id: 'far-southwest', top: '92%', left: '6%', rotate: -8, size: 36 },
];

export function LogoBackdrop() {
    return (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            {LOGO_MARKS.map((mark) => (
                <img
                    key={mark.id}
                    src={logo}
                    alt=""
                    className="absolute opacity-10 dark:opacity-[0.12]"
                    style={{
                        top: mark.top,
                        left: mark.left,
                        width: mark.size,
                        height: mark.size,
                        transform: `rotate(${mark.rotate}deg)`,
                    }}
                />
            ))}
        </div>
    );
}
