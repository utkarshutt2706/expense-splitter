export const queryKeys = {
    balances: {
        group: (groupId: string) => ['balances', groupId] as const,
    },
    dashboard: {
        all: ['dashboard'] as const,
    },
    expenses: {
        group: (groupId: string) => ['expenses', groupId] as const,
        detail: (expenseId: string) => ['expenses', 'detail', expenseId] as const,
    },
    groups: {
        all: ['groups'] as const,
    },
    payments: {
        group: (groupId: string) => ['payments', groupId] as const,
    },
    users: {
        friends: ['users', 'friends'] as const,
    },
} as const;
