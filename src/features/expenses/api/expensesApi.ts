import { httpClient } from '@lib/api/httpClient';
import type {
    CreateExpenseContract,
    ExpenseContract,
    ExpenseSplitContract,
    SplitTypeContract,
} from '@lib/api/contracts';

export type ExpenseWriteInput = CreateExpenseContract;
export type ExpenseSplit = ExpenseSplitContract;
export type SplitType = SplitTypeContract;
export type Expense = Omit<ExpenseContract, 'createdByUserId' | 'paidOn'> &
    Partial<Pick<ExpenseContract, 'createdByUserId' | 'paidOn'>>;

export async function getByGroupId(groupId: string): Promise<Expense[]> {
    const { data } = await httpClient.get<ExpenseContract[]>(`/groups/${groupId}/expenses`);
    return data;
}

export async function getById(groupId: string, expenseId: string): Promise<Expense> {
    const { data } = await httpClient.get<ExpenseContract>(
        `/groups/${groupId}/expenses/${expenseId}`,
    );
    return data;
}

export async function create(groupId: string, input: ExpenseWriteInput): Promise<Expense> {
    const { data } = await httpClient.post<ExpenseContract>(`/groups/${groupId}/expenses`, input);
    return data;
}

export async function update(
    groupId: string,
    expenseId: string,
    input: ExpenseWriteInput,
): Promise<Expense> {
    const { data } = await httpClient.patch<ExpenseContract>(
        `/groups/${groupId}/expenses/${expenseId}`,
        input,
    );
    return data;
}

export async function remove(groupId: string, expenseId: string): Promise<void> {
    await httpClient.delete(`/groups/${groupId}/expenses/${expenseId}`);
}
