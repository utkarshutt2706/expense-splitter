import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@features/users/api/usersApi';

import { type UpsertExpenseFormInitialValues, useUpsertExpenseForm } from './useUpsertExpenseForm';

vi.mock('@app/hooks', () => ({
    useCurrentUser: () => ({ data: { id: 'current', name: 'Current User' } }),
}));

const members: User[] = [
    { id: 'current', name: 'Current User' },
    { id: 'friend', name: 'Friend User' },
];

function renderForm(initialValues?: UpsertExpenseFormInitialValues) {
    const onSubmit = vi.fn();
    return {
        onSubmit,
        ...renderHook(() => useUpsertExpenseForm({ members, initialValues, onSubmit })),
    };
}

async function fillBaseFields(result: ReturnType<typeof renderForm>['result']) {
    await act(async () => {
        result.current.setValue('description', 'Dinner');
        result.current.setValue('amount', 100);
        result.current.setValue('paidByUserId', 'current');
        result.current.setValue('paidOn', '2026-08-17');
    });
}

async function submit(result: ReturnType<typeof renderForm>['result']) {
    await act(async () => {
        await result.current.submit({
            preventDefault: vi.fn(),
        } as unknown as React.BaseSyntheticEvent);
    });
}

describe('useUpsertExpenseForm', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 7, 17, 12));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('initializes a new expense for the current user and all members', () => {
        const { result } = renderForm();

        expect(result.current.getValues()).toEqual({
            description: '',
            amount: undefined,
            paidOn: '2026-08-17',
            paidByUserId: 'current',
        });
        expect(result.current.participantUserIds).toEqual(['current', 'friend']);
        expect(result.current.splitType).toBe('equal');
        expect(result.current.splitValues).toEqual({});
        expect(result.current.defaultPaidOn).toEqual(new Date(2026, 7, 17, 12));
    });

    it('normalizes supplied initial values and preserves edit selections', () => {
        const initialValues: UpsertExpenseFormInitialValues = {
            description: 'Hotel',
            amount: 250,
            paidByUserId: 'friend',
            paidOn: '2026-07-01T00:00:00.000Z',
            participantUserIds: ['friend'],
            splitType: 'shares',
            splitValues: { friend: '2' },
        };
        const { result } = renderForm(initialValues);

        expect(result.current.getValues()).toEqual({
            description: 'Hotel',
            amount: 250,
            paidByUserId: 'friend',
            paidOn: '2026-07-01',
        });
        expect(result.current.participantUserIds).toEqual(['friend']);
        expect(result.current.splitType).toBe('shares');
        expect(result.current.splitValues).toEqual({ friend: '2' });
    });

    it('toggles participants in selection order', () => {
        const { result } = renderForm();

        act(() => result.current.toggleParticipant('friend'));
        expect(result.current.participantUserIds).toEqual(['current']);
        act(() => result.current.toggleParticipant('friend'));
        expect(result.current.participantUserIds).toEqual(['current', 'friend']);
    });

    it('requires a positive amount before changing split type', async () => {
        const empty = renderForm();

        expect(empty.result.current.changeSplitType('exact')).toBe(false);
        expect(empty.result.current.splitType).toBe('equal');
        empty.unmount();

        const { result } = renderForm({
            description: 'Dinner',
            amount: 100,
            paidByUserId: 'current',
            participantUserIds: ['current', 'friend'],
            splitType: 'equal',
            splitValues: {},
        });
        expect(result.current.allocationPreview.status).toBe('valid');
        act(() => result.current.changeSplitValue('current', '100'));
        act(() => result.current.setError('description', { message: 'unrelated' }));
        act(() => result.current.changeSplitType('exact'));

        expect(result.current.splitType).toBe('exact');
        expect(result.current.splitValues).toEqual({});
        expect(result.current.splitError).toBeUndefined();
    });

    it('requires at least one participant before submission', async () => {
        const { result, onSubmit } = renderForm();
        await fillBaseFields(result);
        act(() => {
            result.current.toggleParticipant('current');
            result.current.toggleParticipant('friend');
        });

        await submit(result);

        expect(onSubmit).not.toHaveBeenCalled();
        expect(result.current.participantsError).toBe('Select at least one participant');
    });

    it('submits an equal split after clearing participant errors', async () => {
        const { result, onSubmit } = renderForm();
        await fillBaseFields(result);

        await submit(result);

        expect(onSubmit).toHaveBeenCalledWith({
            description: 'Dinner',
            amount: 100,
            paidByUserId: 'current',
            paidOn: '2026-08-17',
            participantUserIds: ['current', 'friend'],
            splitType: 'equal',
        });
        expect(result.current.participantsError).toBeUndefined();
        expect(result.current.splitError).toBeUndefined();
    });

    it.each([
        [
            'exact',
            { current: '40', friend: '60' },
            'exactSplits',
            [
                { userId: 'current', amount: 40 },
                { userId: 'friend', amount: 60 },
            ],
        ],
        [
            'percentage',
            { current: '40', friend: '60' },
            'percentageSplits',
            [
                { userId: 'current', percentage: 40 },
                { userId: 'friend', percentage: 60 },
            ],
        ],
        [
            'shares',
            { current: '1', friend: '2' },
            'sharesSplits',
            [
                { userId: 'current', shares: 1 },
                { userId: 'friend', shares: 2 },
            ],
        ],
    ] as const)('parses and submits %s split values', async (splitType, values, key, expected) => {
        const { result, onSubmit } = renderForm();
        await fillBaseFields(result);
        act(() => result.current.changeSplitType(splitType));
        for (const [id, value] of Object.entries(values)) {
            act(() => result.current.changeSplitValue(id, value));
        }

        await submit(result);

        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({ splitType, [key]: expected }),
        );
        expect(result.current.splitError).toBeUndefined();
    });

    it('exposes split validation errors instead of submitting invalid allocations', async () => {
        const { result, onSubmit } = renderForm();
        await fillBaseFields(result);
        act(() => result.current.changeSplitType('exact'));
        act(() => result.current.changeSplitValue('current', '25'));
        act(() => result.current.changeSplitValue('friend', '25'));

        await submit(result);

        expect(onSubmit).not.toHaveBeenCalled();
        expect(result.current.splitError).toBe(
            'Exact amounts must add up to the total expense amount',
        );
    });

    it('rejects invalid base fields before running split submission', async () => {
        const { result, onSubmit } = renderForm();
        await act(async () => {
            result.current.setValue('description', ' ');
            result.current.setValue('amount', 0);
            result.current.setValue('paidByUserId', '');
            result.current.setValue('paidOn', '2026-08-18');
        });

        await submit(result);

        expect(onSubmit).not.toHaveBeenCalled();
        expect(result.current.getFieldState('description').error?.message).toBe(
            'Description is required',
        );
        expect(result.current.getFieldState('amount').error?.message).toBe(
            'Amount must be greater than zero',
        );
        expect(result.current.getFieldState('paidByUserId').error?.message).toBe('Select who paid');
        expect(result.current.getFieldState('paidOn').error?.message).toBe(
            'Paid date cannot be in the future',
        );
    });
});
