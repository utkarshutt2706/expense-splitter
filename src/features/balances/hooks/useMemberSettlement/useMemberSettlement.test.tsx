import { act, renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SettlementTransaction } from '@features/balances/api/balancesApi';
import { useCreatePayment } from '@features/payments/hooks/useCreatePayment';
import { useMemberSettlement } from './useMemberSettlement';

vi.mock('@features/payments/hooks/useCreatePayment', () => ({
    useCreatePayment: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: {
        loading: vi.fn(() => 'toast-id'),
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const transaction: SettlementTransaction = {
    fromUserId: 'user-1',
    toUserId: 'user-2',
    amount: 42,
};

describe('useMemberSettlement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('opens and closes a settlement while restoring focus to its trigger', async () => {
        vi.mocked(useCreatePayment).mockReturnValue({
            isPending: false,
            mutate: vi.fn(),
        } as unknown as ReturnType<typeof useCreatePayment>);
        const trigger = document.createElement('button');
        const focus = vi.spyOn(trigger, 'focus');
        const { result } = renderHook(() => useMemberSettlement('group-1'));

        act(() => result.current.openSettlement(transaction, trigger));

        expect(result.current.settlingTransaction).toEqual(transaction);

        act(() => result.current.setSettlementOpen(true));
        expect(result.current.settlingTransaction).toEqual(transaction);

        act(() => result.current.setSettlementOpen(false));
        await act(async () => Promise.resolve());

        expect(result.current.settlingTransaction).toBeNull();
        expect(result.current.paymentError).toBeUndefined();
        expect(focus).toHaveBeenCalledOnce();
    });

    it('does not submit another settlement while a payment is pending', () => {
        const mutate = vi.fn();
        vi.mocked(useCreatePayment).mockReturnValue({
            isPending: true,
            mutate,
        } as unknown as ReturnType<typeof useCreatePayment>);
        const { result } = renderHook(() => useMemberSettlement('group-1'));

        act(() => result.current.submitSettlement(transaction));

        expect(result.current.isPending).toBe(true);
        expect(mutate).not.toHaveBeenCalled();
        expect(toast.loading).not.toHaveBeenCalled();
    });

    it('keeps the dialog open and reports an error when recording fails', () => {
        let onError: (() => void) | undefined;
        const mutate = vi.fn((_values, options: { onError?: () => void }) => {
            onError = options.onError;
        });
        vi.mocked(useCreatePayment).mockReturnValue({
            isPending: false,
            mutate,
        } as unknown as ReturnType<typeof useCreatePayment>);
        const { result } = renderHook(() => useMemberSettlement('group-1'));

        act(() => result.current.openSettlement(transaction, document.createElement('button')));
        act(() => result.current.submitSettlement(transaction));
        act(() => onError?.());

        const message = 'We couldn’t record this payment. Nothing was changed. Try again.';
        expect(result.current.settlingTransaction).toEqual(transaction);
        expect(result.current.paymentError).toBe(message);
        expect(toast.error).toHaveBeenCalledWith(message, { id: 'toast-id' });
    });

    it('closes the dialog and reports success when recording succeeds', () => {
        let onSuccess: (() => void) | undefined;
        const mutate = vi.fn((_values, options: { onSuccess?: () => void }) => {
            onSuccess = options.onSuccess;
        });
        vi.mocked(useCreatePayment).mockReturnValue({
            isPending: false,
            mutate,
        } as unknown as ReturnType<typeof useCreatePayment>);
        const { result } = renderHook(() => useMemberSettlement('group-1'));

        act(() => result.current.openSettlement(transaction, document.createElement('button')));
        act(() => result.current.submitSettlement(transaction));
        act(() => onSuccess?.());

        expect(mutate).toHaveBeenCalledWith(
            { groupId: 'group-1', ...transaction },
            expect.anything(),
        );
        expect(result.current.settlingTransaction).toBeNull();
        expect(toast.success).toHaveBeenCalledWith('Payment recorded', { id: 'toast-id' });
    });
});
