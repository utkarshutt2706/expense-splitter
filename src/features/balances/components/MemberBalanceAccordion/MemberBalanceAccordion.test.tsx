import * as Accordion from '@radix-ui/react-accordion';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import type { SettlementTransaction } from '@features/balances/api/balancesApi';
import { useCreatePayment } from '@features/payments/hooks/useCreatePayment';
import { MemberBalanceAccordion } from './MemberBalanceAccordion';

vi.mock('@features/payments/hooks/useCreatePayment', () => ({
    useCreatePayment: vi.fn(),
}));

interface FakeInitialValues {
    fromUserId: string;
    toUserId: string;
    amount: number;
}

vi.mock('@features/payments/components/RecordPaymentDialog', () => ({
    RecordPaymentDialog: ({
        open,
        initialValues,
        onSubmit,
        settlementMode,
    }: {
        open: boolean;
        initialValues?: FakeInitialValues;
        onSubmit: (values: FakeInitialValues) => void;
        settlementMode?: boolean;
    }) =>
        open ? (
            <div data-testid="record-payment-dialog">
                <span>{settlementMode ? 'Settlement mode' : 'Generic mode'}</span>
                {initialValues && (
                    <p>{`${initialValues.fromUserId}-${initialValues.toUserId}-${initialValues.amount}`}</p>
                )}
                <button type="button" onClick={() => initialValues && onSubmit(initialValues)}>
                    Fake settle submit
                </button>
            </div>
        ) : null,
}));

vi.mock('sonner', () => ({
    toast: {
        loading: vi.fn(() => 'toast-id'),
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const abhinav: User = { id: 'friend-1', name: 'Abhinav', email: 'abhinav@example.com' };
const khem: User = { id: 'friend-2', name: 'Khem', email: 'khem@example.com' };
const currentUser: User = {
    id: CURRENT_USER_ID,
    name: 'Utkarsh Srivastava',
    email: 'u@example.com',
};

const members = [abhinav, khem, currentUser];
const membersById = new Map(members.map((member) => [member.id, member]));

function renderAccordion(
    member: User,
    netAmount: number,
    transactions: SettlementTransaction[],
    defaultValue: string[] = [],
) {
    return render(
        <Accordion.Root type="multiple" defaultValue={defaultValue}>
            <MemberBalanceAccordion
                member={member}
                netAmount={netAmount}
                transactions={transactions}
                membersById={membersById}
                members={members}
                groupId="group-1"
                currentUserId={CURRENT_USER_ID}
            />
        </Accordion.Root>,
    );
}

describe('MemberBalanceAccordion', () => {
    beforeEach(() => {
        vi.mocked(useCreatePayment).mockReturnValue({
            mutate: vi.fn(),
        } as unknown as ReturnType<typeof useCreatePayment>);
    });

    it('shows "gets back" in the owed color for a third-party member with a positive net', () => {
        renderAccordion(khem, 422.5, []);

        const trigger = screen.getByRole('button', { name: /khem gets back ₹422\.50 in total/i });
        expect(trigger).toHaveClass('text-owed');
    });

    it('shows "owes" in the owe color for a third-party member with a negative net', () => {
        renderAccordion(abhinav, -38, []);

        const trigger = screen.getByRole('button', { name: /abhinav owes ₹38\.00 in total/i });
        expect(trigger).toHaveClass('text-owe');
    });

    it('shows a settled message for a third-party member with a zero net', () => {
        renderAccordion(abhinav, 0, []);

        expect(screen.getByRole('button', { name: /abhinav is settled up/i })).toHaveClass(
            'text-settled',
        );
    });

    it('uses "You"/"get"/"are" grammar for the current user\'s own row', () => {
        renderAccordion(currentUser, 50, []);

        expect(
            screen.getByRole('button', { name: /^you get back ₹50\.00 in total$/i }),
        ).toBeInTheDocument();
    });

    it('is collapsed by default unless included in defaultValue', () => {
        renderAccordion(abhinav, 0, []);

        expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    });

    it('is expanded by default when included in defaultValue', () => {
        renderAccordion(abhinav, -38, [], [abhinav.id]);

        expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    });

    it('lists each settlement transaction with "You" substituted for the current user', () => {
        renderAccordion(
            abhinav,
            -38,
            [{ fromUserId: CURRENT_USER_ID, toUserId: abhinav.id, amount: 38 }],
            [abhinav.id],
        );

        expect(screen.getByText('You owe ₹38.00 to Abhinav')).toBeInTheDocument();
    });

    it('lowercases "you" when the current user is the object of the sentence', () => {
        renderAccordion(
            abhinav,
            38,
            [{ fromUserId: abhinav.id, toUserId: CURRENT_USER_ID, amount: 38 }],
            [abhinav.id],
        );

        expect(screen.getByText('Abhinav owes ₹38.00 to you')).toBeInTheDocument();
    });

    it('shows a fallback message when there are no settlement transactions', () => {
        renderAccordion(abhinav, 0, [], [abhinav.id]);

        expect(screen.getByText(/no settlements needed/i)).toBeInTheDocument();
    });

    it('opens the record-payment dialog prefilled from the clicked transaction', async () => {
        const user = userEvent.setup();
        renderAccordion(
            abhinav,
            -38,
            [{ fromUserId: CURRENT_USER_ID, toUserId: abhinav.id, amount: 38 }],
            [abhinav.id],
        );

        await user.click(screen.getByRole('button', { name: 'Settle up' }));

        expect(screen.getByTestId('record-payment-dialog')).toBeInTheDocument();
        expect(screen.getByText('Settlement mode')).toBeInTheDocument();
        expect(screen.getByText(`${CURRENT_USER_ID}-${abhinav.id}-38`)).toBeInTheDocument();
    });

    it('records a payment and shows a loading toast, then success', async () => {
        let onSuccess: (() => void) | undefined;
        const mutate = vi.fn((_values, options: { onSuccess?: () => void }) => {
            onSuccess = options.onSuccess;
        });
        vi.mocked(useCreatePayment).mockReturnValue({
            mutate,
        } as unknown as ReturnType<typeof useCreatePayment>);

        const user = userEvent.setup();
        renderAccordion(
            abhinav,
            -38,
            [{ fromUserId: CURRENT_USER_ID, toUserId: abhinav.id, amount: 38 }],
            [abhinav.id],
        );

        await user.click(screen.getByRole('button', { name: 'Settle up' }));
        await user.click(screen.getByRole('button', { name: /fake settle submit/i }));

        expect(toast.loading).toHaveBeenCalledWith('Payment is being recorded…');
        expect(mutate).toHaveBeenCalledWith(
            {
                groupId: 'group-1',
                fromUserId: CURRENT_USER_ID,
                toUserId: abhinav.id,
                amount: 38,
            },
            expect.anything(),
        );

        act(() => onSuccess?.());

        expect(toast.success).toHaveBeenCalledWith('Payment recorded', { id: 'toast-id' });
    });
});
