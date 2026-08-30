import type { components } from './generated/schema';

type Schemas = components['schemas'];

export type UserContract = Schemas['UserResponseDto'];
export type AuthSessionContract = Schemas['AuthTokenResponseDto'];
export type LoginContract = Schemas['LoginDto'];
export type RegisterContract = Schemas['RegisterDto'];
export type ChangePasswordContract = Schemas['ChangePasswordDto'];
export type UpdateUserContract = Schemas['UpdateUserDto'];

export type GroupContract = Schemas['GroupResponseDto'];
export type GroupSummaryContract = Schemas['GroupSummaryResponseDto'];
export type CreateGroupContract = Schemas['CreateGroupDto'];
export type UpdateGroupContract = Schemas['UpdateGroupDto'];

export type SplitTypeContract = Schemas['CreateExpenseDto']['splitType'];
export type ExpenseSplitContract = Schemas['ExpenseSplitResponseDto'];
export type ExpenseContract = Schemas['ExpenseResponseDto'];
export type CreateExpenseContract = Schemas['CreateExpenseDto'];
export type UpdateExpenseContract = Schemas['UpdateExpenseDto'];

export type PaymentContract = Schemas['PaymentResponseDto'];
export type CreatePaymentContract = Schemas['CreatePaymentDto'];
export type UpdatePaymentContract = Schemas['UpdatePaymentDto'];

export type GroupBalancesContract = Schemas['GroupBalancesResponseDto'];
export type MemberBalanceContract = Schemas['NetBalanceDto'];
export type SettlementTransactionContract = Schemas['SettlementTransactionDto'];

export type DashboardContract = Schemas['DashboardResponseDto'];
export type DashboardGroupSpendContract = Schemas['DashboardGroupSpendDto'];
export type DashboardMemberShareContract = Schemas['DashboardMemberShareDto'];
export type DashboardMonthlySpendContract = Schemas['DashboardMonthlySpendDto'];
export type DashboardDailySpendContract = Schemas['DashboardDailySpendDto'];

export type FriendContract = Schemas['FriendResponseDto'];
