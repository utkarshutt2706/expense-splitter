import { useState } from 'react';

import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { ProgressBar } from '@features/dashboard/components/ProgressBar';
import { Avatar } from '@shared/components';
import { disambiguateParticipantNames, formatCurrency, sortMembersByName } from '@shared/utils';

export type ParticipantsProps = Readonly<{ group: DashboardGroupSpend }>;

export function Participants({ group }: ParticipantsProps) {
    const [showAll, setShowAll] = useState(false);
    const orderedMembers = sortMembersByName(group.memberShares, {
        isCurrentUser: (member) => member.isCurrentUser,
    });
    const labels = disambiguateParticipantNames(orderedMembers);
    const participants = (showAll ? orderedMembers : orderedMembers.slice(0, 8)).map(
        (member, index) => ({ member, label: labels[index] ?? member.name }),
    );
    const max = Math.max(...group.memberShares.map((member) => member.amount), 1);
    if (group.amount === 0) return null;
    return (
        <section aria-labelledby="participants-heading">
            <div>
                <h2 id="participants-heading" className="text-2xl font-semibold">
                    Participant shares
                </h2>
                <p className="text-muted-foreground text-sm">
                    Assigned portions of this group's recorded expenses.
                </p>
            </div>
            <ol className="border-border bg-surface mt-4 divide-y rounded-2xl border">
                {participants.map(({ member, label }, index) => {
                    const percent = (member.amount / group.amount) * 100;
                    const width = Math.max((member.amount / max) * 100, member.amount > 0 ? 2 : 0);
                    return (
                        <li key={member.userId} className="p-4">
                            <div className="flex items-center gap-3">
                                <span className="text-muted-foreground w-5 text-sm">
                                    {index + 1}
                                </span>
                                <span aria-label={`${member.name} avatar`}>
                                    <Avatar name={member.name} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline justify-between gap-3">
                                        <span className="truncate font-medium" title={member.name}>
                                            {label}
                                        </span>
                                        <span className="shrink-0 font-semibold">
                                            {formatCurrency(member.amount)}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-3">
                                        <ProgressBar percentage={width} className="flex-1" />
                                        <span className="text-muted-foreground w-14 text-right text-xs">
                                            {percent.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ol>
            {group.memberShares.length > 8 && (
                <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="focus-visible:ring-brand-500 mt-3 min-h-11 cursor-pointer rounded-lg px-3 text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none"
                >
                    Show all {group.memberShares.length} participants
                </button>
            )}
        </section>
    );
}
