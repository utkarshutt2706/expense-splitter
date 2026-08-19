import type { Expense, ExpenseSplit, SplitType } from '@data/entities';
import type {
    PercentageSplitEntry,
    SharesSplitEntry,
} from '@features/expenses/utils/splitCalculator';
import { httpClient } from '@lib/api/httpClient';

export interface ExpenseWriteInput {
    description: string;
    amount: number;
    paidByUserId: string;
    paidOn?: string;
    splitType: SplitType;
    splits: ExpenseSplit[];
    percentages?: PercentageSplitEntry[];
    shares?: SharesSplitEntry[];
}

export async function getByGroupId(groupId: string): Promise<Expense[]> {
    const { data } = await httpClient.get<Expense[]>(`/groups/${groupId}/expenses`);
    return data;
}

export async function getById(groupId: string, expenseId: string): Promise<Expense> {
    const { data } = await httpClient.get<Expense>(`/groups/${groupId}/expenses/${expenseId}`);
    return data;
}

export async function create(groupId: string, input: ExpenseWriteInput): Promise<Expense> {
    const { data } = await httpClient.post<Expense>(`/groups/${groupId}/expenses`, input);
    return data;
}

export async function update(
    groupId: string,
    expenseId: string,
    input: ExpenseWriteInput,
): Promise<Expense> {
    const { data } = await httpClient.patch<Expense>(
        `/groups/${groupId}/expenses/${expenseId}`,
        input,
    );
    return data;
}

export async function remove(groupId: string, expenseId: string): Promise<void> {
    await httpClient.delete(`/groups/${groupId}/expenses/${expenseId}`);
}
