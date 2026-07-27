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
    splitType: SplitType;
    splits: ExpenseSplit[];
    createdAt: string;
}
