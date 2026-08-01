import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { User } from '@data/entities';
import { CURRENT_USER_ID } from '@data/seed';
import { UpsertExpenseForm } from './UpsertExpenseForm';

vi.mock('@app/hooks', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@app/hooks')>()),
    useCurrentUser: () => ({
        data: { id: CURRENT_USER_ID, name: 'Alex Morgan', email: 'alex@example.com' },
    }),
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

    it('calls onSubmit with the entered values and default participants', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(<UpsertExpenseForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

        await user.type(screen.getByLabelText(/description/i), 'Groceries');
        await user.type(screen.getByLabelText(/amount/i), '42.50');
        await user.click(screen.getByRole('button', { name: /add expense/i }));

        expect(onSubmit).toHaveBeenCalledWith({
            description: 'Groceries',
            amount: 42.5,
            paidByUserId: CURRENT_USER_ID,
            participantUserIds: [CURRENT_USER_ID, 'user-2'],
            splitType: 'equal',
        });
    });

    it('excludes an unchecked participant from the submitted values', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(<UpsertExpenseForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

        await user.type(screen.getByLabelText(/description/i), 'Groceries');
        await user.type(screen.getByLabelText(/amount/i), '42.50');
        await user.click(screen.getByRole('checkbox', { name: /priya sharma/i }));
        await user.click(screen.getByRole('button', { name: /add expense/i }));

        expect(onSubmit).toHaveBeenCalledWith({
            description: 'Groceries',
            amount: 42.5,
            paidByUserId: CURRENT_USER_ID,
            participantUserIds: [CURRENT_USER_ID],
            splitType: 'equal',
        });
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

            await user.click(screen.getByRole('button', { name: 'Exact' }));

            expect(screen.getByRole('spinbutton', { name: 'You amount' })).toBeInTheDocument();
            expect(
                screen.getByRole('spinbutton', { name: /priya sharma amount/i }),
            ).toBeInTheDocument();
        });

        it('shows a trailing percentage input per participant when Percentage is selected', async () => {
            const user = userEvent.setup();
            render(<UpsertExpenseForm members={members} onSubmit={vi.fn()} onCancel={vi.fn()} />);

            await user.click(screen.getByRole('button', { name: 'Percentage' }));

            expect(screen.getByRole('spinbutton', { name: 'You percentage' })).toBeInTheDocument();
        });

        it('shows a trailing shares input per participant when Shares is selected', async () => {
            const user = userEvent.setup();
            render(<UpsertExpenseForm members={members} onSubmit={vi.fn()} onCancel={vi.fn()} />);

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

            expect(onSubmit).toHaveBeenCalledWith({
                description: 'Groceries',
                amount: 42.5,
                paidByUserId: CURRENT_USER_ID,
                participantUserIds: [CURRENT_USER_ID, 'user-2'],
                splitType: 'shares',
                sharesSplits: [
                    { userId: CURRENT_USER_ID, shares: 2 },
                    { userId: 'user-2', shares: 1 },
                ],
            });
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

            expect(onSubmit).toHaveBeenCalledWith({
                description: 'Groceries',
                amount: 42.5,
                paidByUserId: CURRENT_USER_ID,
                participantUserIds: [CURRENT_USER_ID, 'user-2'],
                splitType: 'exact',
                exactSplits: [
                    { userId: CURRENT_USER_ID, amount: 20 },
                    { userId: 'user-2', amount: 22.5 },
                ],
            });
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

            expect(onSubmit).toHaveBeenCalledWith({
                description: 'Groceries',
                amount: 42.5,
                paidByUserId: CURRENT_USER_ID,
                participantUserIds: [CURRENT_USER_ID, 'user-2'],
                splitType: 'percentage',
                percentageSplits: [
                    { userId: CURRENT_USER_ID, percentage: 60 },
                    { userId: 'user-2', percentage: 40 },
                ],
            });
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

            await user.click(screen.getByRole('button', { name: 'Exact' }));
            await user.type(screen.getByRole('spinbutton', { name: 'You amount' }), '20');
            await user.click(screen.getByRole('button', { name: 'Shares' }));

            expect(screen.getByRole('spinbutton', { name: 'You shares' })).toHaveValue(null);
        });
    });

    describe('paid by', () => {
        it('defaults the payer to the current user, labeled "You"', () => {
            render(<UpsertExpenseForm members={members} onSubmit={vi.fn()} onCancel={vi.fn()} />);

            expect(screen.getByRole('button', { name: 'Paid by' })).toHaveTextContent('You');
        });

        it('submits the selected payer when changed', async () => {
            const onSubmit = vi.fn();
            const user = userEvent.setup();
            render(<UpsertExpenseForm members={members} onSubmit={onSubmit} onCancel={vi.fn()} />);

            await user.type(screen.getByLabelText(/description/i), 'Groceries');
            await user.type(screen.getByLabelText(/amount/i), '42.50');
            await user.click(screen.getByRole('button', { name: 'Paid by' }));
            await user.click(screen.getByRole('menuitemradio', { name: /priya sharma/i }));
            await user.click(screen.getByRole('button', { name: /add expense/i }));

            expect(onSubmit).toHaveBeenCalledWith(
                expect.objectContaining({ paidByUserId: 'user-2' }),
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
            expect(screen.getByRole('button', { name: 'Paid by' })).toHaveTextContent(
                /priya sharma/i,
            );
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

            expect(onSubmit).toHaveBeenCalledWith({
                description: 'Dinner',
                amount: 42.5,
                paidByUserId: CURRENT_USER_ID,
                participantUserIds: [CURRENT_USER_ID, 'user-2'],
                splitType: 'equal',
            });
        });
    });
});
