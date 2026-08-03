import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';

import {
    UpsertExpenseForm,
    type UpsertExpenseFormValues,
} from '@features/expenses/components/UpsertExpenseForm';
import { useCreateExpense } from '@features/expenses/hooks/useCreateExpense';
import { useExpense } from '@features/expenses/hooks/useExpense';
import { useUpdateExpense } from '@features/expenses/hooks/useUpdateExpense';
import { buildEditExpenseInitialValues } from '@features/expenses/utils/buildEditExpenseInitialValues';
import { useGroup, useGroupMembers } from '@features/groups';
import { Skeleton } from '@shared/components';

export function UpsertExpensePage() {
    const { groupId, expenseId } = useParams<{ groupId: string; expenseId?: string }>();
    const navigate = useNavigate();
    const isEditMode = expenseId !== undefined;

    const { data: group } = useGroup(groupId ?? '');
    const { data: members, isLoading: isMembersLoading } = useGroupMembers(group?.memberIds ?? []);
    const {
        data: expense,
        isLoading: isExpenseLoading,
        isError: isExpenseError,
    } = useExpense(isEditMode ? (expenseId ?? '') : '');
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

    let content: ReactNode;
    if (isLoading) {
        content = (
            <output
                aria-label={isEditMode ? 'Loading expense…' : 'Loading group…'}
                className="flex flex-col gap-4"
            >
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
            </output>
        );
    } else if (isEditMode && (isExpenseError || !expense)) {
        content = <div className="text-red-600">Couldn't load this expense.</div>;
    } else {
        content = (
            <UpsertExpenseForm
                mode={isEditMode ? 'edit' : 'add'}
                members={members ?? []}
                initialValues={
                    isEditMode && expense ? buildEditExpenseInitialValues(expense) : undefined
                }
                onSubmit={handleSubmit}
                onCancel={() => navigate(backTo)}
            />
        );
    }

    return (
        <div>
            <Link
                to={backTo}
                className="text-muted-foreground hover:text-surface-foreground mb-4 inline-flex items-center gap-1 text-sm"
            >
                <ArrowLeft className="size-4" />
                {isEditMode ? 'Back to expense' : 'Back to group'}
            </Link>

            <h1 className="font-display text-surface-foreground mb-1 text-xl font-medium">
                {isEditMode ? 'Edit expense' : 'Add an expense'}
            </h1>
            <p className="text-muted-foreground mb-4 text-sm">
                {isEditMode
                    ? "Update this expense's details and how it's split."
                    : 'Record a new expense and split it among participants.'}
            </p>

            {content}
        </div>
    );
}
