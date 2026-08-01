import { ReceiptIndianRupee } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import type { User } from '@data/entities';
import { useCreateExpense } from '@features/expenses/hooks/useCreateExpense';
import { UpsertExpenseDialog } from '../UpsertExpenseDialog';
import type { UpsertExpenseFormValues } from '../UpsertExpenseForm';

interface AddExpenseActionProps {
    readonly groupId: string;
    readonly members: User[];
}

export function AddExpenseAction({ groupId, members }: AddExpenseActionProps) {
    const createExpense = useCreateExpense();
    const [isAddingExpense, setIsAddingExpense] = useState(false);

    const handleAddExpense = ({
        description,
        amount,
        paidByUserId,
        participantUserIds,
        splitType,
        exactSplits,
        percentageSplits,
        sharesSplits,
    }: UpsertExpenseFormValues) => {
        const toastId = toast.loading('Expense is being added…');
        createExpense.mutate(
            {
                groupId,
                description,
                amount,
                paidByUserId,
                participantUserIds,
                splitType,
                exactSplits,
                percentageSplits,
                sharesSplits,
            },
            {
                onSuccess: () => toast.success('Expense added', { id: toastId }),
                onError: (error) => toast.error(error.message, { id: toastId }),
            },
        );
    };

    return (
        <>
            {members.length > 0 && (
                <button
                    type="button"
                    aria-label="Add expense"
                    title="Add expense"
                    onClick={() => setIsAddingExpense(true)}
                    className="bg-brand-600 hover:bg-brand-700 fixed right-6 bottom-6 inline-flex cursor-pointer items-center gap-1 rounded-md px-4 py-2 text-sm font-medium text-white capitalize shadow-lg"
                >
                    <ReceiptIndianRupee className="size-4" />
                    Add expense
                </button>
            )}

            <UpsertExpenseDialog
                open={isAddingExpense}
                onOpenChange={setIsAddingExpense}
                members={members}
                onSubmit={handleAddExpense}
            />
        </>
    );
}
