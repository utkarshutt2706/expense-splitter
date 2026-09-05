import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@features/users/api/usersApi';
import { CURRENT_USER_ID } from '@test/fixtures/ids';
import { UpsertExpenseForm } from './UpsertExpenseForm';

vi.mock('@app/hooks', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/hooks')>()),
    useCurrentUser: () => ({
        data: { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
    }),
}));

vi.mock('@shared/components', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@shared/components')>()),
    MemberPicker: ({
        members,
        value,
        onChange,
        ariaLabel,
    }: {
        members: User[];
        value: string;
        onChange: (id: string) => void;
        ariaLabel: string;
    }) => (
        <select
            aria-label={ariaLabel}
            value={value}
            onChange={(event) => onChange(event.target.value)}
        >
            {members.map((member) => (
                <option key={member.id} value={member.id}>
                    {member.id === CURRENT_USER_ID ? 'You' : member.name}
                </option>
            ))}
        </select>
    ),
}));

vi.mock('sonner', () => ({
    toast: {
        loading: vi.fn(() => 'toast-id'),
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
    },
}));

const members: User[] = [
    { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
    { id: 'user-2', name: 'Priya Sharma', email: 'priya@example.com' },
];

describe('UpsertExpenseForm', () => {
    it('shows validation errors when submitted without a description or amount', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(<UpsertExpenseForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

        await user.click(screen.getByRole('button', { name: /add expense/i }));

        expect(await screen.findByText(/description is required/i)).toBeInTheDocument();
        expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows a validation error when the amount is zero', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();

        render(<UpsertExpenseForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

        await user.type(screen.getByLabelText(/description/i), 'Groceries');
        await user.type(screen.getByLabelText(/amount/i), '0');
        await user.click(screen.getByRole('button', { name: /add expense/i }));

        expect(await screen.findByText(/amount must be greater than zero/i)).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows a validation error when the amount is negative', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();

        render(<UpsertExpenseForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

        await user.type(screen.getByLabelText(/description/i), 'Groceries');
        await user.type(screen.getByLabelText(/amount/i), '-42.50');
        await user.click(screen.getByRole('button', { name: /add expense/i }));

        expect(await screen.findByText(/amount must be greater than zero/i)).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('defaults to splitting between every group member', () => {
        render(<UpsertExpenseForm members={members} onSubmit={vi.fn()} onCancel={vi.fn()} />);

        expect(screen.getByRole('checkbox', { name: 'You' })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: /priya sharma/i })).toBeChecked();
    });

    it('allows unchecking the current user as a participant', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(<UpsertExpenseForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

        await user.type(screen.getByLabelText(/description/i), 'Groceries');
        await user.type(screen.getByLabelText(/amount/i), '42.50');
        await user.click(screen.getByRole('checkbox', { name: 'You' }));
        await user.click(screen.getByRole('button', { name: /add expense/i }));

        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({ participantUserIds: ['user-2'] }),
        );
    });

    it('defaults the paid date to today and submits it with the entered values', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        const today = new Date();
        const todayInput = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 10);

        render(<UpsertExpenseForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

        expect(screen.getByLabelText(/paid on/i)).toHaveValue(todayInput);

        await user.type(screen.getByLabelText(/description/i), 'Groceries');
        await user.type(screen.getByLabelText(/amount/i), '42.50');
        await user.click(screen.getByRole('button', { name: /add expense/i }));

        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                description: 'Groceries',
                amount: 42.5,
                paidByUserId: CURRENT_USER_ID,
                paidOn: todayInput,
                participantUserIds: [CURRENT_USER_ID, 'user-2'],
                splitType: 'equal',
            }),
        );
    });

    it('opens the calendar when the paid date input is clicked', async () => {
        const user = userEvent.setup();
        const showPicker = vi.fn();
        render(<UpsertExpenseForm members={members} onSubmit={vi.fn()} onCancel={vi.fn()} />);
        Object.defineProperty(screen.getByLabelText(/paid on/i), 'showPicker', {
            configurable: true,
            value: showPicker,
        });

        await user.click(screen.getByLabelText(/paid on/i));

        expect(showPicker).toHaveBeenCalledOnce();
    });

    it('rejects a manually entered future paid date', async () => {
        const user = userEvent.setup();
        render(<UpsertExpenseForm members={members} onSubmit={vi.fn()} onCancel={vi.fn()} />);

        await user.clear(screen.getByLabelText(/paid on/i));
        await user.type(screen.getByLabelText(/paid on/i), '2099-12-31');
        await user.click(screen.getByRole('button', { name: /add expense/i }));

        expect(await screen.findByText(/paid date cannot be in the future/i)).toBeInTheDocument();
    });

    it('excludes an unchecked participant from the submitted values', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(<UpsertExpenseForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

        await user.type(screen.getByLabelText(/description/i), 'Groceries');
        await user.type(screen.getByLabelText(/amount/i), '42.50');
        await user.click(screen.getByRole('checkbox', { name: /priya sharma/i }));
        await user.click(screen.getByRole('button', { name: /add expense/i }));

        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                description: 'Groceries',
                amount: 42.5,
                paidByUserId: CURRENT_USER_ID,
                participantUserIds: [CURRENT_USER_ID],
                splitType: 'equal',
            }),
        );
    });

    it('shows an error and does not submit when every participant is unchecked', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(<UpsertExpenseForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

        await user.type(screen.getByLabelText(/description/i), 'Groceries');
        await user.type(screen.getByLabelText(/amount/i), '42.50');
        await user.click(screen.getByRole('checkbox', { name: 'You' }));
        await user.click(screen.getByRole('checkbox', { name: /priya sharma/i }));
        await user.click(screen.getByRole('button', { name: /add expense/i }));

        expect(await screen.findByText(/select at least one participant/i)).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('calls onCancel when the cancel button is clicked', async () => {
        const onCancel = vi.fn();
        const user = userEvent.setup();
        render(<UpsertExpenseForm members={members} onSubmit={vi.fn()} onCancel={onCancel} />);

        await user.click(screen.getByRole('button', { name: /cancel/i }));

        expect(onCancel).toHaveBeenCalled();
    });

    describe('split type', () => {
        it('defaults to the equal split type with no trailing inputs', () => {
            render(<UpsertExpenseForm members={members} onSubmit={vi.fn()} onCancel={vi.fn()} />);

            expect(screen.getByRole('button', { name: 'Equal' })).toHaveAttribute(
                'aria-pressed',
                'true',
            );
            expect(screen.queryByRole('spinbutton', { name: /you/i })).not.toBeInTheDocument();
        });

        it('shows a trailing amount input per participant when Exact is selected', async () => {
            const user = userEvent.setup();
            render(<UpsertExpenseForm members={members} onSubmit={vi.fn()} onCancel={vi.fn()} />);

            await user.type(screen.getByLabelText(/amount/i), '42.50');
            await user.click(screen.getByRole('button', { name: 'Exact' }));

            expect(screen.getByRole('spinbutton', { name: 'You amount' })).toBeInTheDocument();
            expect(
                screen.getByRole('spinbutton', { name: /priya sharma amount/i }),
            ).toBeInTheDocument();
        });

        it('shows a trailing percentage input per participant when Percentage is selected', async () => {
            const user = userEvent.setup();
            render(<UpsertExpenseForm members={members} onSubmit={vi.fn()} onCancel={vi.fn()} />);

            await user.type(screen.getByLabelText(/amount/i), '42.50');
            await user.click(screen.getByRole('button', { name: 'Percentage' }));

            expect(screen.getByRole('spinbutton', { name: 'You percentage' })).toBeInTheDocument();
        });

        it('shows a trailing shares input per participant when Shares is selected', async () => {
            const user = userEvent.setup();
            render(<UpsertExpenseForm members={members} onSubmit={vi.fn()} onCancel={vi.fn()} />);

            await user.type(screen.getByLabelText(/amount/i), '42.50');
            await user.click(screen.getByRole('button', { name: 'Shares' }));

            expect(screen.getByRole('spinbutton', { name: 'You shares' })).toBeInTheDocument();
        });

        it('submits share counts for every participant', async () => {
            const onSubmit = vi.fn();
            const user = userEvent.setup();
            render(<UpsertExpenseForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

            await user.type(screen.getByLabelText(/description/i), 'Groceries');
            await user.type(screen.getByLabelText(/amount/i), '42.50');
            await user.click(screen.getByRole('button', { name: 'Shares' }));
            await user.type(screen.getByRole('spinbutton', { name: 'You shares' }), '2');
            await user.type(screen.getByRole('spinbutton', { name: /priya sharma shares/i }), '1');
            await user.click(screen.getByRole('button', { name: /add expense/i }));

            expect(onSubmit).toHaveBeenCalledWith(
                expect.objectContaining({
                    description: 'Groceries',
                    amount: 42.5,
                    paidByUserId: CURRENT_USER_ID,
                    participantUserIds: [CURRENT_USER_ID, 'user-2'],
                    splitType: 'shares',
                    sharesSplits: [
                        { userId: CURRENT_USER_ID, shares: 2 },
                        { userId: 'user-2', shares: 1 },
                    ],
                }),
            );
        });

        it('shows an error and does not submit when a share count is left blank', async () => {
            const onSubmit = vi.fn();
            const user = userEvent.setup();
            render(<UpsertExpenseForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

            await user.type(screen.getByLabelText(/description/i), 'Groceries');
            await user.type(screen.getByLabelText(/amount/i), '42.50');
            await user.click(screen.getByRole('button', { name: 'Shares' }));
            await user.type(screen.getByRole('spinbutton', { name: 'You shares' }), '2');
            await user.click(screen.getByRole('button', { name: /add expense/i }));

            expect(
                await screen.findByText(/enter a share count for every participant/i),
            ).toBeInTheDocument();
            expect(onSubmit).not.toHaveBeenCalled();
        });

        it('submits exact split amounts that add up to the total', async () => {
            const onSubmit = vi.fn();
            const user = userEvent.setup();
            render(<UpsertExpenseForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

            await user.type(screen.getByLabelText(/description/i), 'Groceries');
            await user.type(screen.getByLabelText(/amount/i), '42.50');
            await user.click(screen.getByRole('button', { name: 'Exact' }));
            await user.type(screen.getByRole('spinbutton', { name: 'You amount' }), '20');
            await user.type(
                screen.getByRole('spinbutton', { name: /priya sharma amount/i }),
                '22.50',
            );
            await user.click(screen.getByRole('button', { name: /add expense/i }));

            expect(onSubmit).toHaveBeenCalledWith(
                expect.objectContaining({
                    description: 'Groceries',
                    amount: 42.5,
                    paidByUserId: CURRENT_USER_ID,
                    participantUserIds: [CURRENT_USER_ID, 'user-2'],
                    splitType: 'exact',
                    exactSplits: [
                        { userId: CURRENT_USER_ID, amount: 20 },
                        { userId: 'user-2', amount: 22.5 },
                    ],
                }),
            );
        });

        it('shows an error and does not submit when exact amounts do not add up to the total', async () => {
            const onSubmit = vi.fn();
            const user = userEvent.setup();
            render(<UpsertExpenseForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

            await user.type(screen.getByLabelText(/description/i), 'Groceries');
            await user.type(screen.getByLabelText(/amount/i), '42.50');
            await user.click(screen.getByRole('button', { name: 'Exact' }));
            await user.type(screen.getByRole('spinbutton', { name: 'You amount' }), '20');
            await user.type(screen.getByRole('spinbutton', { name: /priya sharma amount/i }), '10');
            await user.click(screen.getByRole('button', { name: /add expense/i }));

            expect(
                await screen.findByText(/exact amounts must add up to the total expense amount/i),
            ).toBeInTheDocument();
            expect(onSubmit).not.toHaveBeenCalled();
        });

        it('shows an error and does not submit when an exact amount is left blank', async () => {
            const onSubmit = vi.fn();
            const user = userEvent.setup();
            render(<UpsertExpenseForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

            await user.type(screen.getByLabelText(/description/i), 'Groceries');
            await user.type(screen.getByLabelText(/amount/i), '42.50');
            await user.click(screen.getByRole('button', { name: 'Exact' }));
            await user.type(screen.getByRole('spinbutton', { name: 'You amount' }), '42.50');
            await user.click(screen.getByRole('button', { name: /add expense/i }));

            expect(
                await screen.findByText(/enter an amount for every participant/i),
            ).toBeInTheDocument();
            expect(onSubmit).not.toHaveBeenCalled();
        });

        it('submits percentages that add up to 100', async () => {
            const onSubmit = vi.fn();
            const user = userEvent.setup();
            render(<UpsertExpenseForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

            await user.type(screen.getByLabelText(/description/i), 'Groceries');
            await user.type(screen.getByLabelText(/amount/i), '42.50');
            await user.click(screen.getByRole('button', { name: 'Percentage' }));
            await user.type(screen.getByRole('spinbutton', { name: 'You percentage' }), '60');
            await user.type(
                screen.getByRole('spinbutton', { name: /priya sharma percentage/i }),
                '40',
            );
            await user.click(screen.getByRole('button', { name: /add expense/i }));

            expect(onSubmit).toHaveBeenCalledWith(
                expect.objectContaining({
                    description: 'Groceries',
                    amount: 42.5,
                    paidByUserId: CURRENT_USER_ID,
                    participantUserIds: [CURRENT_USER_ID, 'user-2'],
                    splitType: 'percentage',
                    percentageSplits: [
                        { userId: CURRENT_USER_ID, percentage: 60 },
                        { userId: 'user-2', percentage: 40 },
                    ],
                }),
            );
        });

        it('shows an error and does not submit when percentages do not add up to 100', async () => {
            const onSubmit = vi.fn();
            const user = userEvent.setup();
            render(<UpsertExpenseForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

            await user.type(screen.getByLabelText(/description/i), 'Groceries');
            await user.type(screen.getByLabelText(/amount/i), '42.50');
            await user.click(screen.getByRole('button', { name: 'Percentage' }));
            await user.type(screen.getByRole('spinbutton', { name: 'You percentage' }), '60');
            await user.type(
                screen.getByRole('spinbutton', { name: /priya sharma percentage/i }),
                '30',
            );
            await user.click(screen.getByRole('button', { name: /add expense/i }));

            expect(
                await screen.findByText(/split percentages must add up to 100/i),
            ).toBeInTheDocument();
            expect(onSubmit).not.toHaveBeenCalled();
        });

        it('shows an error and does not submit when a percentage is left blank', async () => {
            const onSubmit = vi.fn();
            const user = userEvent.setup();
            render(<UpsertExpenseForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

            await user.type(screen.getByLabelText(/description/i), 'Groceries');
            await user.type(screen.getByLabelText(/amount/i), '42.50');
            await user.click(screen.getByRole('button', { name: 'Percentage' }));
            await user.type(screen.getByRole('spinbutton', { name: 'You percentage' }), '100');
            await user.click(screen.getByRole('button', { name: /add expense/i }));

            expect(
                await screen.findByText(/enter a percentage for every participant/i),
            ).toBeInTheDocument();
            expect(onSubmit).not.toHaveBeenCalled();
        });

        it('clears entered split values when switching split type', async () => {
            const user = userEvent.setup();
            render(<UpsertExpenseForm members={members} onSubmit={vi.fn()} onCancel={vi.fn()} />);

            await user.type(screen.getByLabelText(/amount/i), '42.50');
            await user.click(screen.getByRole('button', { name: 'Exact' }));
            await user.type(screen.getByRole('spinbutton', { name: 'You amount' }), '20');
            await user.click(screen.getByRole('button', { name: 'Shares' }));

            expect(screen.getByRole('spinbutton', { name: 'You shares' })).toHaveValue(null);
        });

        it('blocks changing the split type until an amount is entered, with a toast', async () => {
            const user = userEvent.setup();
            render(<UpsertExpenseForm members={members} onSubmit={vi.fn()} onCancel={vi.fn()} />);

            await user.click(screen.getByRole('button', { name: 'Exact' }));

            expect(toast.warning).toHaveBeenCalledWith(
                'Enter an amount before choosing how to split it',
            );
            expect(screen.getByRole('button', { name: 'Equal' })).toHaveAttribute(
                'aria-pressed',
                'true',
            );
            expect(screen.queryByRole('spinbutton', { name: /you/i })).not.toBeInTheDocument();
        });

        it('allows changing the split type once a valid amount is entered', async () => {
            const user = userEvent.setup();
            render(<UpsertExpenseForm members={members} onSubmit={vi.fn()} onCancel={vi.fn()} />);

            await user.type(screen.getByLabelText(/amount/i), '0');
            await user.click(screen.getByRole('button', { name: 'Exact' }));

            expect(toast.warning).toHaveBeenCalledWith(
                'Enter an amount before choosing how to split it',
            );
            expect(screen.getByRole('button', { name: 'Equal' })).toHaveAttribute(
                'aria-pressed',
                'true',
            );

            await user.clear(screen.getByLabelText(/amount/i));
            await user.type(screen.getByLabelText(/amount/i), '42.50');
            await user.click(screen.getByRole('button', { name: 'Exact' }));

            expect(screen.getByRole('button', { name: 'Exact' })).toHaveAttribute(
                'aria-pressed',
                'true',
            );
        });
    });

    describe('split helper text', () => {
        it('shows the resolved equal split and updates it with amount and participants', async () => {
            const user = userEvent.setup();
            render(<UpsertExpenseForm members={members} onSubmit={vi.fn()} onCancel={vi.fn()} />);

            expect(
                screen.getByText('Enter a valid expense amount to preview the allocation.'),
            ).toBeInTheDocument();

            await user.type(screen.getByLabelText(/amount/i), '100');
            expect(screen.getByText('2 participants · ₹50.00 each')).toBeInTheDocument();

            await user.click(screen.getByRole('checkbox', { name: /priya sharma/i }));
            expect(screen.getByText('1 participant · ₹100.00 each')).toBeInTheDocument();
        });

        it('shows the canonical remainder allocation for an indivisible equal split', async () => {
            const user = userEvent.setup();
            const threeMembers = [
                ...members,
                { id: 'user-3', name: 'Sam Lee', email: 'sam@example.com' },
            ];
            render(
                <UpsertExpenseForm members={threeMembers} onSubmit={vi.fn()} onCancel={vi.fn()} />,
            );

            await user.type(screen.getByLabelText(/amount/i), '100');

            expect(
                screen.getByText('2 participants receive ₹33.33 · 1 participant receives ₹33.34'),
            ).toBeInTheDocument();
        });

        it('shows how much of the expense amount is left to allocate for an exact split', async () => {
            const user = userEvent.setup();
            render(<UpsertExpenseForm members={members} onSubmit={vi.fn()} onCancel={vi.fn()} />);

            await user.type(screen.getByLabelText(/amount/i), '42.50');
            await user.click(screen.getByRole('button', { name: 'Exact' }));

            expect(screen.getByText('₹0.00 assigned · ₹42.50 remaining')).toBeInTheDocument();

            await user.type(screen.getByRole('spinbutton', { name: 'You amount' }), '50');

            expect(
                screen.getByText('₹50.00 assigned · ₹7.50 over the expense total'),
            ).toBeInTheDocument();
        });

        it('shows how many percentage points are left to allocate for a percentage split', async () => {
            const user = userEvent.setup();
            render(<UpsertExpenseForm members={members} onSubmit={vi.fn()} onCancel={vi.fn()} />);

            await user.type(screen.getByLabelText(/amount/i), '42.50');
            await user.click(screen.getByRole('button', { name: 'Percentage' }));

            expect(screen.getByText('0% assigned · 100% remaining')).toBeInTheDocument();

            await user.type(screen.getByRole('spinbutton', { name: 'You percentage' }), '60');

            expect(screen.getByText('60% assigned · 40% remaining')).toBeInTheDocument();
        });

        it('shows the running total of entered shares for a shares split', async () => {
            const user = userEvent.setup();
            render(<UpsertExpenseForm members={members} onSubmit={vi.fn()} onCancel={vi.fn()} />);

            await user.type(screen.getByLabelText(/amount/i), '42.50');
            await user.click(screen.getByRole('button', { name: 'Shares' }));

            expect(
                screen.getByText(
                    '0 shares in total · Enter a positive share for every participant',
                ),
            ).toBeInTheDocument();

            await user.type(screen.getByRole('spinbutton', { name: 'You shares' }), '1');

            expect(
                screen.getByText('1 share in total · Enter a positive share for every participant'),
            ).toBeInTheDocument();

            await user.type(screen.getByRole('spinbutton', { name: /priya sharma shares/i }), '2');

            expect(screen.getByText('3 shares in total')).toBeInTheDocument();
        });

        it('shows resolved monetary values for complete percentage and shares splits', async () => {
            const user = userEvent.setup();
            render(<UpsertExpenseForm members={members} onSubmit={vi.fn()} onCancel={vi.fn()} />);

            await user.type(screen.getByLabelText(/amount/i), '100');
            await user.click(screen.getByRole('button', { name: 'Percentage' }));
            await user.type(screen.getByRole('spinbutton', { name: 'You percentage' }), '50');
            await user.type(
                screen.getByRole('spinbutton', { name: /priya sharma percentage/i }),
                '50',
            );

            expect(screen.getByText('100% assigned')).toBeInTheDocument();
            expect(screen.getAllByText('₹50.00')).toHaveLength(2);

            await user.click(screen.getByRole('button', { name: 'Shares' }));
            await user.type(screen.getByRole('spinbutton', { name: 'You shares' }), '1');
            await user.type(screen.getByRole('spinbutton', { name: /priya sharma shares/i }), '2');

            expect(screen.getByText('3 shares in total')).toBeInTheDocument();
            expect(screen.getByText('₹33.33')).toBeInTheDocument();
            expect(screen.getByText('₹66.67')).toBeInTheDocument();
        });
    });

    describe('paid by', () => {
        it('defaults the payer to the current user, labeled "You"', () => {
            render(<UpsertExpenseForm members={members} onSubmit={vi.fn()} onCancel={vi.fn()} />);

            expect(screen.getByRole('combobox', { name: 'Paid by' })).toHaveValue(CURRENT_USER_ID);
            expect(screen.getByRole('option', { name: 'You' })).toBeInTheDocument();
        });

        it('submits the selected payer when changed', async () => {
            const onSubmit = vi.fn();
            const user = userEvent.setup();
            render(<UpsertExpenseForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

            await user.type(screen.getByLabelText(/description/i), 'Groceries');
            await user.type(screen.getByLabelText(/amount/i), '42.50');
            await user.selectOptions(screen.getByRole('combobox', { name: 'Paid by' }), 'user-2');
            await user.click(screen.getByRole('button', { name: /add expense/i }));

            await waitFor(() =>
                expect(onSubmit).toHaveBeenCalledWith(
                    expect.objectContaining({ paidByUserId: 'user-2' }),
                ),
            );
        });
    });

    describe('edit mode', () => {
        it('prefills description, amount, payer, participants, and split type', () => {
            render(
                <UpsertExpenseForm
                    mode="edit"
                    members={members}
                    initialValues={{
                        description: 'Groceries',
                        amount: 42.5,
                        paidByUserId: 'user-2',
                        paidOn: '2026-07-18T00:00:00.000Z',
                        participantUserIds: ['user-2'],
                        splitType: 'exact',
                        splitValues: { 'user-2': '42.50' },
                    }}
                    onSubmit={vi.fn()}
                    onCancel={vi.fn()}
                />,
            );

            expect(screen.getByLabelText(/description/i)).toHaveValue('Groceries');
            expect(screen.getByLabelText(/^amount$/i)).toHaveValue(42.5);
            expect(screen.getByLabelText(/paid on/i)).toHaveValue('2026-07-18');
            expect(screen.getByRole('combobox', { name: 'Paid by' })).toHaveValue('user-2');
            expect(screen.getByRole('checkbox', { name: 'You' })).not.toBeChecked();
            expect(screen.getByRole('checkbox', { name: /priya sharma/i })).toBeChecked();
            expect(screen.getByRole('button', { name: 'Exact' })).toHaveAttribute(
                'aria-pressed',
                'true',
            );
            expect(screen.getByRole('spinbutton', { name: /priya sharma amount/i })).toHaveValue(
                42.5,
            );
        });

        it('shows a "Save changes" submit button instead of "Add expense"', () => {
            render(
                <UpsertExpenseForm
                    mode="edit"
                    members={members}
                    initialValues={{
                        description: 'Groceries',
                        amount: 42.5,
                        paidByUserId: CURRENT_USER_ID,
                        participantUserIds: [CURRENT_USER_ID],
                        splitType: 'equal',
                        splitValues: {},
                    }}
                    onSubmit={vi.fn()}
                    onCancel={vi.fn()}
                />,
            );

            expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /add expense/i })).not.toBeInTheDocument();
        });

        it('submits the edited values', async () => {
            const onSubmit = vi.fn();
            const user = userEvent.setup();
            render(
                <UpsertExpenseForm
                    mode="edit"
                    members={members}
                    initialValues={{
                        description: 'Groceries',
                        amount: 42.5,
                        paidByUserId: CURRENT_USER_ID,
                        participantUserIds: [CURRENT_USER_ID, 'user-2'],
                        splitType: 'equal',
                        splitValues: {},
                    }}
                    onSubmit={onSubmit}
                    onCancel={vi.fn()}
                />,
            );

            await user.clear(screen.getByLabelText(/description/i));
            await user.type(screen.getByLabelText(/description/i), 'Dinner');
            await user.click(screen.getByRole('button', { name: /save changes/i }));

            expect(onSubmit).toHaveBeenCalledWith(
                expect.objectContaining({
                    description: 'Dinner',
                    amount: 42.5,
                    paidByUserId: CURRENT_USER_ID,
                    participantUserIds: [CURRENT_USER_ID, 'user-2'],
                    splitType: 'equal',
                }),
            );
        });
    });
});
