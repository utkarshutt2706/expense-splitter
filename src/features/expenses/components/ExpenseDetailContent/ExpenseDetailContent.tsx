import type { Expense } from '@features/expenses/api/expensesApi';
import type { User } from '@features/users/api/usersApi';
import { Avatar } from '@shared/components';
import { formatCurrency, participantNameMap, sortMembersByName } from '@shared/utils';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});

function memberLabel(member: User | undefined, names: Map<string, string>): string {
    if (!member) return 'Someone';
    return names.get(member.id) ?? member.name;
}

function shareLabel(label: string): string {
    if (label === 'You') return 'Your share';
    return /s$/i.test(label.replace(/ \(You\)$/, '').trim())
        ? `Share for ${label}`
        : `${label}’s share`;
}

export type ExpenseDetailContentProps = Readonly<{
    expense: Expense;
    members: User[];
    currentUserId?: string;
}>;

export function ExpenseDetailContent({
    expense,
    members,
    currentUserId,
}: ExpenseDetailContentProps) {
    const membersById = new Map(members.map((member) => [member.id, member]));
    const names = participantNameMap(members, currentUserId);
    const splitsByUserId = new Map(expense.splits.map((split) => [split.userId, split.amount]));
    const payer = membersById.get(expense.paidByUserId);
    const participants = sortMembersByName(
        members.filter((member) => splitsByUserId.has(member.id)),
        { isCurrentUser: (member) => member.id === currentUserId },
    );
    const addedBy = membersById.get(expense.createdByUserId ?? expense.paidByUserId);
    const createdDate = dateFormatter.format(new Date(expense.createdAt));
    const paidDate = dateFormatter.format(new Date(expense.paidOn ?? expense.createdAt));
    const payerSplit = expense.splits.find((split) => split.userId === expense.paidByUserId);
    const coveredForOthersCents =
        payerSplit && Number.isFinite(payerSplit.amount) && Number.isFinite(expense.amount)
            ? Math.round(expense.amount * 100) - Math.round(payerSplit.amount * 100)
            : 0;

    return (
        <div className="flex flex-col gap-6">
            <div>
                <p className="text-surface-foreground text-2xl font-semibold">
                    {formatCurrency(expense.amount)}
                </p>
                <p className="text-muted-foreground text-sm">{`Added by ${memberLabel(addedBy, names)} on ${createdDate}`}</p>
            </div>
            <div>
                <div className="flex items-center gap-3">
                    <Avatar name={payer?.name ?? '?'} />
                    <p className="text-surface-foreground font-medium">
                        {`${memberLabel(payer, names)} paid ${formatCurrency(expense.amount)} `}
                        <span className="text-muted-foreground">{`on ${paidDate}`}</span>
                    </p>
                </div>
                {coveredForOthersCents > 0 && (
                    <p className="text-muted-foreground mt-2 ml-11 text-sm">{`${memberLabel(payer, names)} covered ${formatCurrency(coveredForOthersCents / 100)} for others.`}</p>
                )}
                <ul className="relative mt-3 ml-4.5 flex flex-col gap-4">
                    <span
                        aria-hidden="true"
                        className="bg-border absolute top-0 bottom-6 left-0 w-px"
                    />
                    {participants.map((member, index) => {
                        const share = splitsByUserId.get(member.id)!;
                        const isLast = index === participants.length - 1;
                        return (
                            <li key={member.id} className="relative flex items-center gap-2 pl-6">
                                {isLast ? (
                                    <span
                                        aria-hidden="true"
                                        className="border-border absolute top-0 left-0 h-1/2 w-5 rounded-bl-md border-b border-l"
                                    />
                                ) : (
                                    <span
                                        aria-hidden="true"
                                        className="bg-border absolute top-1/2 left-0 h-px w-5 -translate-y-1/2"
                                    />
                                )}
                                <Avatar name={member.name} size="sm" />
                                <span className="text-surface-foreground text-sm">{`${shareLabel(names.get(member.id) ?? member.name)} ${formatCurrency(share)}`}</span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
