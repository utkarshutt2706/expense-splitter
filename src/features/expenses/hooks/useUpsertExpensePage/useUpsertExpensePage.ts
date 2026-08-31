import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';

import type { UpsertExpenseFormValues } from '@features/expenses/components/UpsertExpenseForm';
import { useCreateExpense } from '@features/expenses/hooks/useCreateExpense';
import { useExpense } from '@features/expenses/hooks/useExpense';
import { useUpdateExpense } from '@features/expenses/hooks/useUpdateExpense';
import { buildEditExpenseInitialValues } from '@features/expenses/utils/buildEditExpenseInitialValues';
import { useGroup, useGroupMembers } from '@features/groups';

export function useUpsertExpensePage() {
    const { groupId, expenseId } = useParams<{ groupId: string; expenseId?: string }>();
    const navigate = useNavigate();
    const isEditMode = expenseId !== undefined;
    const { data: group } = useGroup(groupId ?? '');
    const { data: members, isLoading: isMembersLoading } = useGroupMembers(group?.memberIds ?? []);
    const {
        data: expense,
        isLoading: isExpenseLoading,
        isError: isExpenseError,
    } = useExpense(groupId ?? '', isEditMode ? (expenseId ?? '') : '');
    const createExpense = useCreateExpense();
    const updateExpense = useUpdateExpense();
    const isLoading = isMembersLoading || (isEditMode && isExpenseLoading);
    const backTo = isEditMode ? `/groups/${groupId}/expenses/${expenseId}` : `/groups/${groupId}`;

    const handleSubmit = (values: UpsertExpenseFormValues) => {
        if (!groupId) return;

        if (isEditMode && expenseId) {
            const toastId = toast.loading('Expense is being updated…');
            updateExpense.mutate(
                { id: expenseId, groupId, ...values },
                {
                    onSuccess: () => {
                        toast.success('Expense updated', { id: toastId });
                        navigate(backTo);
                    },
                    onError: (error) => toast.error(error.message, { id: toastId }),
                },
            );
            return;
        }

        const toastId = toast.loading('Expense is being added…');
        createExpense.mutate(
            { groupId, ...values },
            {
                onSuccess: () => {
                    toast.success('Expense added', { id: toastId });
                    navigate(backTo);
                },
                onError: (error) => toast.error(error.message, { id: toastId }),
            },
        );
    };

    return {
        backTo,
        cancel: () => navigate(backTo),
        expense,
        handleSubmit,
        initialValues: isEditMode && expense ? buildEditExpenseInitialValues(expense) : undefined,
        isEditMode,
        isExpenseError,
        isLoading,
        members: members ?? [],
    };
}
