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
    // Fired when the trigger button is clicked, before the dialog opens — lets a
    // parent fan-out menu (GroupFabMenu) collapse itself without this component
    // needing to know that menu exists.
    readonly onTriggerClick?: () => void;
}

export function AddExpenseAction({ groupId, members, onTriggerClick }: AddExpenseActionProps) {
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
                    onClick={() => {
                        onTriggerClick?.();
                        setIsAddingExpense(true);
                    }}
                    className="bg-brand-600 hover:bg-brand-700 inline-flex size-12 cursor-pointer items-center justify-center rounded-full text-white shadow-lg"
                >
                    <ReceiptIndianRupee className="size-5" />
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
