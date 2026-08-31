import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';

import { useCurrentUser } from '@app/hooks';
import { useDeleteExpense } from '@features/expenses/hooks/useDeleteExpense';
import { useExpense } from '@features/expenses/hooks/useExpense';
import { useGroup, useGroupMembers } from '@features/groups';

const DELETE_ERROR_MESSAGE = 'We couldn’t delete this expense. Nothing was changed. Try again.';

export function useExpenseDetailPage() {
    const { groupId, expenseId } = useParams<{ groupId: string; expenseId: string }>();
    const navigate = useNavigate();
    const { data: currentUser } = useCurrentUser();
    const {
        data: expense,
        isLoading: isExpenseLoading,
        isFetching: isExpenseFetching,
        isError: isExpenseError,
    } = useExpense(groupId ?? '', expenseId ?? '');
    const { data: group } = useGroup(groupId ?? '');
    const { data: members, isLoading: isMembersLoading } = useGroupMembers(group?.memberIds ?? []);
    const deleteExpense = useDeleteExpense();
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [deleteError, setDeleteError] = useState<string>();
    const deleteButtonRef = useRef<HTMLButtonElement>(null);
    const isLoading = isExpenseLoading || isMembersLoading;
    const isRefreshing = !isLoading && isExpenseFetching;

    const openDeleteDialog = () => {
        setDeleteError(undefined);
        setIsConfirmingDelete(true);
    };

    const setDeleteDialogOpen = (open: boolean) => {
        setIsConfirmingDelete(open);
        if (!open) {
            setDeleteError(undefined);
            queueMicrotask(() => deleteButtonRef.current?.focus());
        }
    };

    const handleDelete = () => {
        if (!expense || !groupId || deleteExpense.isPending) return;
        setDeleteError(undefined);
        const toastId = toast.loading('Expense is being deleted…');
        deleteExpense.mutate(
            { id: expense.id, groupId },
            {
                onSuccess: () => {
                    setIsConfirmingDelete(false);
                    toast.success('Expense deleted', { id: toastId });
                    navigate(`/groups/${groupId}`);
                },
                onError: () => {
                    setDeleteError(DELETE_ERROR_MESSAGE);
                    toast.error(DELETE_ERROR_MESSAGE, { id: toastId });
                },
            },
        );
    };

    return {
        currentUserId: currentUser?.id,
        deleteButtonRef,
        deleteError,
        expense,
        expenseId,
        group,
        groupId,
        handleDelete,
        isConfirmingDelete,
        isDeletePending: deleteExpense.isPending,
        isExpenseError,
        isLoading,
        isRefreshing,
        members: members ?? [],
        openDeleteDialog,
        setDeleteDialogOpen,
    };
}
