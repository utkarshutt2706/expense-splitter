export interface MemberNetBalance {
    readonly userId: string;
    readonly amount: number;
}

export interface SettlementTransaction {
    readonly fromUserId: string;
    readonly toUserId: string;
    readonly amount: number;
}

function toCents(amount: number): number {
    return Math.round(amount * 100);
}

interface MutableParty {
    userId: string;
    cents: number;
}

// The standard "Simplify Debt" greedy algorithm: repeatedly settle the largest
// remaining debtor against the largest remaining creditor. This minimizes the
// total number of settle-up transactions across the whole group — e.g. if A
// owes B and B owes C the same amount, B nets to zero and this produces a
// single A-owes-C transaction instead of two separate ones.
export function simplifyDebts(netBalances: MemberNetBalance[]): SettlementTransaction[] {
    const creditors: MutableParty[] = [];
    const debtors: MutableParty[] = [];

    for (const balance of netBalances) {
        const cents = toCents(balance.amount);
        if (cents > 0) {
            creditors.push({ userId: balance.userId, cents });
        } else if (cents < 0) {
            debtors.push({ userId: balance.userId, cents: -cents });
        }
    }

    creditors.sort((a, b) => b.cents - a.cents);
    debtors.sort((a, b) => b.cents - a.cents);

    const transactions: SettlementTransaction[] = [];
    let debtorIndex = 0;
    let creditorIndex = 0;

    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
        const debtor = debtors[debtorIndex]!;
        const creditor = creditors[creditorIndex]!;
        const settledCents = Math.min(debtor.cents, creditor.cents);

        transactions.push({
            fromUserId: debtor.userId,
            toUserId: creditor.userId,
            amount: settledCents / 100,
        });

        debtor.cents -= settledCents;
        creditor.cents -= settledCents;

        if (debtor.cents === 0) debtorIndex += 1;
        if (creditor.cents === 0) creditorIndex += 1;
    }

    return transactions;
}
