import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@features/users/api/usersApi';

import { type RecordPaymentFormInitialValues, useRecordPaymentForm } from './useRecordPaymentForm';

vi.mock('@app/hooks', () => ({
    useCurrentUser: () => ({ data: { id: 'current', name: 'Alex Smith' } }),
}));

const members: User[] = [
    { id: 'current', name: 'Alex Smith' },
    { id: 'alex-j', name: 'Alex Jones' },
    { id: 'friend', name: 'Friend User' },
];

function renderForm(
    options: {
        initialValues?: RecordPaymentFormInitialValues;
        lockParticipants?: boolean;
        outstandingAmount?: number;
    } = {},
) {
    const onSubmit = vi.fn();
    return {
        onSubmit,
        ...renderHook(() =>
            useRecordPaymentForm({
                members,
                onSubmit,
                lockParticipants: options.lockParticipants ?? false,
                initialValues: options.initialValues,
                outstandingAmount: options.outstandingAmount,
            }),
        ),
    };
}

async function submit(result: ReturnType<typeof renderForm>['result']) {
    await act(async () => {
        await result.current.submit({
            preventDefault: vi.fn(),
        } as unknown as React.BaseSyntheticEvent);
    });
}

describe('useRecordPaymentForm', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 7, 17, 12));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('initializes a new payment from the current user on today', () => {
        const { result } = renderForm();

        expect(result.current.getValues()).toEqual({
            fromUserId: 'current',
            toUserId: '',
            amount: undefined,
            paidOn: '2026-08-17',
        });
        expect(result.current.amountCents).toBe(0);
        expect(result.current.outstandingCents).toBeUndefined();
        expect(result.current.amountDescriptionId).toBeUndefined();
    });

    it('normalizes initial values and calculates cent values', () => {
        const { result } = renderForm({
            initialValues: {
                fromUserId: 'friend',
                toUserId: 'current',
                amount: 12.345,
                paidOn: '2026-07-01T00:00:00.000Z',
            },
            outstandingAmount: 20.005,
        });

        expect(result.current.getValues()).toEqual({
            fromUserId: 'friend',
            toUserId: 'current',
            amount: 12.345,
            paidOn: '2026-07-01',
        });
        expect(result.current.amountCents).toBe(1235);
        expect(result.current.outstandingCents).toBe(2001);
        expect(result.current.amountDescriptionId).toBe('payment-impact');
    });

    it('provides disambiguated participant labels and an unknown fallback', () => {
        const { result } = renderForm();

        expect(result.current.memberName('current')).toBe('You');
        expect(result.current.memberName('alex-j')).toBe('Alex J');
        expect(result.current.memberName('friend')).toBe('Friend');
        expect(result.current.memberName('missing')).toBe('Unknown member');
    });

    it.each([
        [100, 100, 'This settles the suggested balance in full.'],
        [40, 100, '₹60.00 will remain after this payment.'],
        [120, 100, 'Amount cannot exceed the outstanding balance of ₹100.00.'],
    ])('describes the payment impact for amount %s against %s', (amount, outstanding, expected) => {
        const { result } = renderForm({
            initialValues: {
                fromUserId: 'current',
                toUserId: 'friend',
                amount,
            },
            outstandingAmount: outstanding,
        });

        expect(result.current.paymentImpact).toBe(expected);
    });

    it('submits a valid payment', async () => {
        const { result, onSubmit } = renderForm({
            initialValues: {
                fromUserId: 'current',
                toUserId: 'friend',
                amount: 75,
                paidOn: '2026-08-10',
            },
            outstandingAmount: 100,
        });

        await submit(result);

        expect(onSubmit).toHaveBeenCalledWith({
            fromUserId: 'current',
            toUserId: 'friend',
            amount: 75,
            paidOn: '2026-08-10',
        });
    });

    it('rejects an amount above the outstanding balance at cent precision', async () => {
        const { result, onSubmit } = renderForm({
            initialValues: {
                fromUserId: 'current',
                toUserId: 'friend',
                amount: 100.01,
            },
            outstandingAmount: 100,
        });

        await submit(result);

        expect(onSubmit).not.toHaveBeenCalled();
        expect(result.current.getFieldState('amount').error?.message).toBe(
            'Amount cannot exceed the outstanding balance of ₹100.00',
        );
    });

    it('rejects schema-invalid payment fields', async () => {
        const { result, onSubmit } = renderForm({
            initialValues: {
                fromUserId: 'current',
                toUserId: 'current',
                amount: 0,
                paidOn: '2026-08-18',
            },
        });

        await submit(result);

        expect(onSubmit).not.toHaveBeenCalled();
        expect(result.current.getFieldState('amount').error?.message).toBe(
            'Amount must be greater than zero',
        );
        expect(result.current.getFieldState('toUserId').error?.message).toBe(
            'Choose two different people',
        );
        expect(result.current.getFieldState('paidOn').error?.message).toBe(
            'Paid date cannot be in the future',
        );
    });

    it('uses the amount error as its accessible description when validation fails', async () => {
        const { result } = renderForm({
            initialValues: {
                fromUserId: 'current',
                toUserId: 'friend',
                amount: 0,
            },
            outstandingAmount: 100,
        });
        void result.current.formState.errors.amount;

        await submit(result);

        expect(result.current.amountDescriptionId).toBe('payment-amount-error');
    });

    it('focuses the amount input when participants are locked', () => {
        const options = { lockParticipants: false };
        const { result, rerender } = renderForm(options);
        const input = document.createElement('input');
        const focus = vi.spyOn(input, 'focus');
        result.current.amountInputRef.current = input;

        options.lockParticipants = true;
        rerender();

        expect(focus).toHaveBeenCalledOnce();
    });
});
