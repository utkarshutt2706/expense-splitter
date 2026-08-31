import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { UpsertExpenseForm } from '@features/expenses/components/UpsertExpenseForm';
import { useUpsertExpensePage } from '@features/expenses/hooks/useUpsertExpensePage';
import { Skeleton } from '@shared/components';

function upsertExpenseContent({
    isLoading,
    isEditMode,
    hasExpense,
    isExpenseError,
    form,
}: Readonly<{
    isLoading: boolean;
    isEditMode: boolean;
    hasExpense: boolean;
    isExpenseError: boolean;
    form: ReactNode;
}>): ReactNode {
    if (isLoading) {
        return (
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
    }
    if (isEditMode && (isExpenseError || !hasExpense)) {
        return <div className="text-red-600">Couldn't load this expense.</div>;
    }
    return form;
}

export function UpsertExpensePage() {
    const {
        backTo,
        cancel,
        expense,
        handleSubmit,
        initialValues,
        isEditMode,
        isExpenseError,
        isLoading,
        members,
    } = useUpsertExpensePage();

    const content = upsertExpenseContent({
        isLoading,
        isEditMode,
        hasExpense: expense !== undefined,
        isExpenseError,
        form: (
            <UpsertExpenseForm
                mode={isEditMode ? 'edit' : 'add'}
                members={members}
                initialValues={initialValues}
                onSubmit={handleSubmit}
                onCancel={cancel}
            />
        ),
    });

    return (
        <div>
            <Link
                to={backTo}
                className="text-muted-foreground hover:text-surface-foreground mb-4 inline-flex items-center gap-1 text-sm"
            >
                <ArrowLeft className="size-4" />
                {isEditMode ? 'Back to expense' : 'Back to group'}
            </Link>

            <h1 className="text-surface-foreground mb-1 text-xl font-medium">
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
