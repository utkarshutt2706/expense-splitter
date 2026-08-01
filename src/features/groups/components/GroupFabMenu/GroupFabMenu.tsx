import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

import type { User } from '@data/entities';
import { SettleUpAction } from '@features/balances/components/SettleUpAction';
import { AddExpenseAction } from '@features/expenses';
import { RecordPaymentAction } from '@features/payments';

interface GroupFabMenuProps {
    readonly groupId: string;
    readonly members: User[];
}

const FAN_RADIUS = 88;

// angleDeg follows the standard math convention (0 = right, 90 = up, 180 = left) —
// the toggle sits in the bottom-right corner, so the fan only ever sweeps through
// the upper-left quadrant; right or below would push items off-screen.
function offsetAtAngle(angleDeg: number) {
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
        x: Math.round(FAN_RADIUS * Math.cos(angleRad)),
        y: Math.round(-FAN_RADIUS * Math.sin(angleRad)),
    };
}

const ADD_EXPENSE_OFFSET = offsetAtAngle(90);
const RECORD_PAYMENT_OFFSET = offsetAtAngle(135);
const SETTLE_UP_OFFSET = offsetAtAngle(180);

interface FanSlotProps {
    readonly isOpen: boolean;
    readonly offset: { x: number; y: number };
    readonly delayMs: number;
    readonly children: ReactNode;
}

// Always mounted (never conditionally removed) so the open/close transform and
// opacity actually animate — a component that unmounts on close has nothing to
// transition from. `inert` keeps it out of the tab order and unclickable while
// collapsed, since it's still sitting in the DOM at the toggle's own position.
function FanSlot({ isOpen, offset, delayMs, children }: FanSlotProps) {
    return (
        <div
            className="fixed right-6 bottom-6 transition-all duration-200 ease-out"
            style={{
                transform: isOpen
                    ? `translate(${offset.x}px, ${offset.y}px) scale(1)`
                    : 'translate(0, 0) scale(0.4)',
                opacity: isOpen ? 1 : 0,
                transitionDelay: isOpen ? `${delayMs}ms` : '0ms',
            }}
            inert={!isOpen}
        >
            {children}
        </div>
    );
}

export function GroupFabMenu({ groupId, members }: GroupFabMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const close = () => setIsOpen(false);

    return (
        <>
            <FanSlot isOpen={isOpen} offset={SETTLE_UP_OFFSET} delayMs={0}>
                <SettleUpAction groupId={groupId} />
            </FanSlot>
            <FanSlot isOpen={isOpen} offset={RECORD_PAYMENT_OFFSET} delayMs={40}>
                <RecordPaymentAction groupId={groupId} members={members} onTriggerClick={close} />
            </FanSlot>
            <FanSlot isOpen={isOpen} offset={ADD_EXPENSE_OFFSET} delayMs={80}>
                <AddExpenseAction groupId={groupId} members={members} onTriggerClick={close} />
            </FanSlot>

            <button
                type="button"
                aria-label={isOpen ? 'Close actions menu' : 'Open actions menu'}
                title={isOpen ? 'Close actions menu' : 'Open actions menu'}
                aria-expanded={isOpen}
                onClick={() => setIsOpen((open) => !open)}
                className="bg-brand-600 hover:bg-brand-700 fixed right-6 bottom-6 inline-flex size-14 cursor-pointer items-center justify-center rounded-full text-white shadow-lg"
            >
                <Plus
                    className="size-6 transition-transform duration-200 ease-out"
                    style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
                />
            </button>
        </>
    );
}
