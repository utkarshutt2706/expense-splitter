import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { formatCurrency } from '@shared/utils';

export type PositionBalanceProps = Readonly<{
    receive: number;
    pay: number;
    selected?: DashboardGroupSpend;
}>;

export function PositionBalance({ receive, pay, selected }: PositionBalanceProps) {
    if (receive > 0 && pay > 0) {
        return (
            <>
                <span className="text-owed">To receive {formatCurrency(receive)}</span>
                <span className="text-owe">To pay {formatCurrency(pay)}</span>
            </>
        );
    }
    if (receive > 0) {
        return (
            <span className="text-owed font-semibold">
                You are owed {formatCurrency(receive)} {selected ? '' : 'overall'}
            </span>
        );
    }
    if (pay > 0) {
        return (
            <span className="text-owe font-semibold">
                You owe {formatCurrency(pay)} {selected ? '' : 'overall'}
            </span>
        );
    }
    return <span>You are settled up</span>;
}
