export interface User {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
}

export interface Group {
    id: string;
    name: string;
    memberIds: string[];
    createdAt: string;
}

export type SplitType = 'equal' | 'exact' | 'percentage' | 'shares';

export interface ExpenseSplit {
    userId: string;
    amount: number;
}

export interface Expense {
    id: string;
    groupId: string;
    description: string;
    amount: number;
    paidByUserId: string;
    createdByUserId?: string;
    splitType: SplitType;
    splits: ExpenseSplit[];
    createdAt: string;
}

// A direct transfer settling part of a debt between two group members, distinct
// from an Expense (a shared cost split among participants). fromUserId is who
// paid, toUserId is who received.
export interface Payment {
    id: string;
    groupId: string;
    fromUserId: string;
    toUserId: string;
    amount: number;
    createdAt: string;
}
